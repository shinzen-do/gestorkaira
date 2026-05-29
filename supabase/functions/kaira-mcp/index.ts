// MCP server (Model Context Protocol) pra Kaira.
// Roteamento por path-suffix (Supabase Edge Functions enviam todo path sob
// /functions/v1/kaira-mcp pra esse handler).
//
// Rotas:
//   GET   /                                              health check
//   POST  /  (ou /messages)                              MCP JSON-RPC
//
//   OAuth 2.1 (claude.ai custom connector):
//   GET   /.well-known/oauth-protected-resource          RFC 9728
//   GET   /.well-known/oauth-authorization-server        RFC 8414
//   POST  /register                                      RFC 7591 (DCR)
//   POST  /token                                         RFC 6749 §4.1.3 + PKCE
//   (GET /authorize é tratado pelo Vercel — SPA React faz consent + chama RPC)
//
// Auth nas requisições MCP: Bearer <token>, onde token pode ser:
//   - api_key (gerado em Settings → Conectores) — prefixo "kaira_"
//   - oauth access token — prefixo "kao_" (sha256 lookup em oauth_tokens)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// MCP URL pública (via Vercel rewrite, fica no host do app).
// Se rodando standalone, fallback pra URL Supabase direto.
const PUBLIC_MCP_URL = Deno.env.get("PUBLIC_MCP_URL") ?? "https://gestorkaira.vercel.app/mcp";
const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "https://gestorkaira.vercel.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id, www-authenticate",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// Helpers
// ============================================================

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256b64url(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(prefix: string, bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  const b64 = btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${prefix}${b64}`;
}

function jsonResp(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", ...extraHeaders },
  });
}

// Extrai o sufixo de path depois de /functions/v1/kaira-mcp
function getSuffix(url: URL): string {
  const path = url.pathname.replace(/^.*\/kaira-mcp/, "") || "/";
  return path;
}

// ============================================================
// Auth pra MCP requests
// ============================================================

interface Session {
  userId: string;
  source: "api_key" | "oauth";
  id: string;
}

async function authenticate(req: Request): Promise<Session | null> {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  const hash = await sha256hex(token);

  if (token.startsWith("kaira_")) {
    const { data, error } = await admin
      .from("api_keys")
      .select("id, user_id, revoked_at")
      .eq("key_hash", hash)
      .maybeSingle();
    if (error || !data || data.revoked_at) return null;
    admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {}, () => {});
    return { userId: data.user_id, source: "api_key", id: data.id };
  }

  if (token.startsWith("kao_")) {
    const { data, error } = await admin
      .from("oauth_tokens")
      .select("id, user_id, revoked_at, expires_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error || !data || data.revoked_at) return null;
    if (new Date(data.expires_at) < new Date()) return null;
    admin.from("oauth_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {}, () => {});
    return { userId: data.user_id, source: "oauth", id: data.id };
  }

  return null;
}

// ============================================================
// JSON-RPC + MCP tools (Phase 1 inalterado)
// ============================================================

interface JsonRpcReq {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: JsonRpcReq["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function rpcError(id: JsonRpcReq["id"], code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}
function textContent(text: string) {
  return { content: [{ type: "text", text }] };
}

const TOOLS = [
  {
    name: "kaira_list_clients",
    description: "Lista clientes do usuário. Use isso antes de criar pra evitar duplicados.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "kaira_create_client",
    description: "Cria cliente.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        industry: { type: "string" },
        monthly_budget: { type: "number" },
        notes: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "kaira_create_campaign",
    description: "Cria campanha vinculada a cliente. Pegue client_id via kaira_list_clients.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        name: { type: "string" },
        objective: { type: "string" },
        budget: { type: "number" },
        budget_type: { type: "string", enum: ["daily", "total"] },
        budget_strategy: { type: "string", enum: ["cbo", "abo"] },
        spend: { type: "number" },
        roas: { type: "number" },
      },
      required: ["client_id", "name"],
    },
  },
  {
    name: "kaira_create_audience",
    description: "Cria público.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        gender: { type: "string", enum: ["all", "male", "female"] },
        age_min: { type: "number" },
        age_max: { type: "number" },
        interests: { type: "array", items: { type: "string" } },
        size_estimate: { type: "number" },
      },
      required: ["name"],
    },
  },
  {
    name: "kaira_add_calendar_note",
    description: "Adiciona nota no calendário.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        date: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["title", "date"],
    },
  },
  {
    name: "kaira_seed_demo_data",
    description: "Popula conta com dados realistas (5 clientes, 12 campanhas, públicos, notas). Idempotente: skipa se já tem ≥3 clientes.",
    inputSchema: { type: "object", properties: {} },
  },

  // ---- Leitura ----
  {
    name: "kaira_account_summary",
    description: "Resumo da conta: totais (clientes, campanhas, gasto) + por cliente (gasto total, ROAS médio, orçamento, nº campanhas). Use pra visão geral antes de analisar.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "kaira_list_campaigns",
    description: "Lista campanhas. Filtra por client_id e/ou status (active|paused|archived).",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kaira_list_ad_sets",
    description: "Lista ad sets (conjuntos de anúncios). Filtra por campaign_id.",
    inputSchema: { type: "object", properties: { campaign_id: { type: "string" }, limit: { type: "number" } } },
  },
  {
    name: "kaira_list_creatives",
    description: "Lista criativos (anúncios). Filtra por ad_set_id. Inclui métricas (ctr, impressões, resultados, custo por resultado).",
    inputSchema: { type: "object", properties: { ad_set_id: { type: "string" }, limit: { type: "number" } } },
  },
  {
    name: "kaira_list_audiences",
    description: "Lista públicos do usuário.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "kaira_list_calendar_notes",
    description: "Lista notas do calendário. Filtra por intervalo de datas (from/to no formato YYYY-MM-DD) e/ou só pendentes.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        only_pending: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "kaira_list_tasks",
    description: "Lista tarefas (ai_tasks). only_pending=true mostra só as não concluídas.",
    inputSchema: { type: "object", properties: { only_pending: { type: "boolean" }, limit: { type: "number" } } },
  },
  {
    name: "kaira_list_timeline",
    description: "Lista o histórico/auditoria de mudanças. Filtra por target_type (client|campaign|adset|audience|creative) e target_id.",
    inputSchema: {
      type: "object",
      properties: {
        target_type: { type: "string", enum: ["client", "campaign", "adset", "audience", "creative"] },
        target_id: { type: "string" },
        limit: { type: "number" },
      },
    },
  },

  // ---- Criação ----
  {
    name: "kaira_create_ad_set",
    description: "Cria ad set numa campanha. Pegue campaign_id via kaira_list_campaigns.",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "string" },
        name: { type: "string" },
        budget: { type: "number" },
        budget_type: { type: "string", enum: ["daily", "total"] },
        status: { type: "string", enum: ["active", "paused", "archived"] },
      },
      required: ["campaign_id", "name"],
    },
  },
  {
    name: "kaira_create_creative",
    description: "Cria criativo num ad set. Pegue ad_set_id via kaira_list_ad_sets.",
    inputSchema: {
      type: "object",
      properties: {
        ad_set_id: { type: "string" },
        name: { type: "string" },
        format: { type: "string", enum: ["image", "video", "carousel"] },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        url: { type: "string" },
        ctr: { type: "number" },
        impressions: { type: "number" },
        results: { type: "number" },
        result_label: { type: "string" },
        cost_per_result: { type: "number" },
      },
      required: ["ad_set_id", "name"],
    },
  },
  {
    name: "kaira_create_task",
    description: "Cria tarefa na conta do gestor.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        due_date: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "kaira_link_audience_to_campaign",
    description: "Vincula um público a uma campanha (relação N:N).",
    inputSchema: {
      type: "object",
      properties: { audience_id: { type: "string" }, campaign_id: { type: "string" } },
      required: ["audience_id", "campaign_id"],
    },
  },

  // ---- Atualização ----
  {
    name: "kaira_update_client",
    description: "Atualiza cliente. Informe id + só os campos a mudar.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        industry: { type: "string" },
        monthly_budget: { type: "number" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        notes: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "kaira_update_campaign",
    description: "Atualiza campanha. Informe id + só os campos a mudar (ex: status, budget, spend, roas).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        objective: { type: "string" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        budget: { type: "number" },
        spend: { type: "number" },
        roas: { type: "number" },
        budget_type: { type: "string", enum: ["daily", "total"] },
        budget_strategy: { type: "string", enum: ["cbo", "abo"] },
      },
      required: ["id"],
    },
  },
  {
    name: "kaira_update_ad_set",
    description: "Atualiza ad set. Informe id + campos a mudar.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        budget: { type: "number" },
        budget_type: { type: "string", enum: ["daily", "total"] },
      },
      required: ["id"],
    },
  },
  {
    name: "kaira_update_creative",
    description: "Atualiza criativo, inclusive métricas (ctr, impressões, resultados, custo). Informe id + campos a mudar.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
        format: { type: "string", enum: ["image", "video", "carousel"] },
        url: { type: "string" },
        ctr: { type: "number" },
        impressions: { type: "number" },
        results: { type: "number" },
        result_label: { type: "string" },
        cost_per_result: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "kaira_update_audience",
    description: "Atualiza público. Informe id + campos a mudar.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        gender: { type: "string", enum: ["all", "male", "female"] },
        age_min: { type: "number" },
        age_max: { type: "number" },
        interests: { type: "array", items: { type: "string" } },
        size_estimate: { type: "number" },
        status: { type: "string", enum: ["active", "paused", "archived"] },
      },
      required: ["id"],
    },
  },
  {
    name: "kaira_set_calendar_note_done",
    description: "Marca nota do calendário como concluída (done=true) ou reabre (done=false). Default: true.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, done: { type: "boolean" } }, required: ["id"] },
  },
  {
    name: "kaira_set_task_done",
    description: "Marca tarefa como concluída (done=true) ou reabre (done=false). Default: true.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, done: { type: "boolean" } }, required: ["id"] },
  },

  // ---- Exclusão (irreversível) ----
  {
    name: "kaira_delete_client",
    description: "Deleta cliente. CUIDADO: cascateia e apaga TODAS campanhas, ad sets e criativos desse cliente. Confirme com o usuário antes.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_campaign",
    description: "Deleta campanha. CUIDADO: cascateia e apaga ad sets e criativos dela. Confirme antes.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_ad_set",
    description: "Deleta ad set. CUIDADO: cascateia e apaga os criativos dele.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_creative",
    description: "Deleta criativo.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_audience",
    description: "Deleta público.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_calendar_note",
    description: "Deleta nota do calendário.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "kaira_delete_task",
    description: "Deleta tarefa.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
];

// ---- Helpers CRUD escopados por dono ----
// admin client (service role) bypassa RLS, então filtramos user_id em TODA query.
function opt(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}
function optNum(v: unknown): number | undefined {
  return v === undefined || v === null || v === "" ? undefined : Number(v);
}
function buildPatch(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}
async function ownedUpdate(table: string, id: string, userId: string, patch: Record<string, unknown>, label: string) {
  const clean = buildPatch(patch);
  if (Object.keys(clean).length === 0) throw new Error("Nenhum campo pra atualizar foi informado.");
  const { data, error } = await admin.from(table).update(clean)
    .eq("id", id).eq("user_id", userId).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`${label} não encontrado (id ${id}) ou não pertence a você.`);
  return textContent(`${label} atualizado (id: ${id}). Campos: ${Object.keys(clean).join(", ")}`);
}
async function ownedDelete(table: string, id: string, userId: string, label: string) {
  const { error, count } = await admin.from(table).delete({ count: "exact" })
    .eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!count) throw new Error(`${label} não encontrado (id ${id}) ou não pertence a você.`);
  return textContent(`${label} deletado (id: ${id}).`);
}

async function callTool(name: string, args: Record<string, unknown>, userId: string) {
  switch (name) {
    case "kaira_list_clients": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      const { data, error } = await admin
        .from("clients").select("id, name, industry, monthly_budget, status, notes")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ clients: data ?? [] }, null, 2));
    }
    case "kaira_create_client": {
      const { data, error } = await admin.from("clients").insert({
        user_id: userId, name: String(args.name),
        industry: args.industry ? String(args.industry) : null,
        monthly_budget: Number(args.monthly_budget ?? 0),
        notes: args.notes ? String(args.notes) : null,
      }).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Cliente criado: ${data.name} (id: ${data.id})`);
    }
    case "kaira_create_campaign": {
      const { data, error } = await admin.from("campaigns").insert({
        user_id: userId, client_id: String(args.client_id), name: String(args.name),
        objective: args.objective ? String(args.objective) : null,
        budget: Number(args.budget ?? 0),
        budget_type: (args.budget_type as string) ?? "daily",
        budget_strategy: (args.budget_strategy as string) ?? "abo",
        spend: Number(args.spend ?? 0), roas: Number(args.roas ?? 0),
      }).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Campanha criada: ${data.name} (id: ${data.id})`);
    }
    case "kaira_create_audience": {
      const { data, error } = await admin.from("audiences").insert({
        user_id: userId, name: String(args.name),
        description: args.description ? String(args.description) : null,
        gender: (args.gender as string) ?? "all",
        age_min: Number(args.age_min ?? 18), age_max: Number(args.age_max ?? 65),
        interests: Array.isArray(args.interests) ? args.interests : [],
        size_estimate: args.size_estimate ? Number(args.size_estimate) : null,
      }).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Público criado: ${data.name} (id: ${data.id})`);
    }
    case "kaira_add_calendar_note": {
      const { data, error } = await admin.from("calendar_notes").insert({
        user_id: userId, title: String(args.title),
        description: args.description ? String(args.description) : null,
        date: String(args.date), priority: (args.priority as string) ?? "medium",
        link_type: "none", link_id: null,
      }).select("id, title").single();
      if (error) throw new Error(error.message);
      return textContent(`Nota criada: ${data.title} (id: ${data.id})`);
    }
    case "kaira_seed_demo_data": {
      const { count } = await admin.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if ((count ?? 0) >= 3) return textContent(`Conta já tem ${count} clientes. Skip seed.`);
      const demo = [
        { name: "Acme Cosméticos", industry: "E-commerce beauty", monthly_budget: 8000 },
        { name: "Studio Pilates Vida", industry: "Saúde / Wellness", monthly_budget: 3500 },
        { name: "Imobiliária Horizonte", industry: "Imobiliário", monthly_budget: 12000 },
        { name: "DentalCare Sorrisos", industry: "Saúde / Odonto", monthly_budget: 4500 },
        { name: "Aurora Moda Íntima", industry: "E-commerce moda", monthly_budget: 6000 },
      ].map((c) => ({ ...c, user_id: userId }));
      const { data: clients, error: cErr } = await admin.from("clients").insert(demo).select("id, name, monthly_budget");
      if (cErr) throw new Error(cErr.message);
      const campMap: Record<string, string[]> = {
        "Acme Cosméticos": ["Black Friday — Conversão", "Aquecimento BF", "Remarketing AOV"],
        "Studio Pilates Vida": ["Captação Alunos — Leads", "Aniversariantes do Mês"],
        "Imobiliária Horizonte": ["Lançamento Aurora", "Apartamentos Beira-mar", "Investidores Premium"],
        "DentalCare Sorrisos": ["Clareamento — Promoção", "Ortodontia Adultos"],
        "Aurora Moda Íntima": ["Linha Renda Verão", "Dia das Mães"],
      };
      const objs = ["Vendas", "Conversão", "Leads", "Tráfego", "Engajamento"];
      const camps: Array<Record<string, unknown>> = [];
      for (const c of clients ?? []) {
        (campMap[c.name] ?? []).forEach((n, i) => {
          const daily = Math.round((c.monthly_budget / 30) * (0.6 + Math.random() * 0.6));
          camps.push({
            user_id: userId, client_id: c.id, name: n, objective: objs[i % objs.length],
            budget: daily, budget_type: "daily", budget_strategy: i === 0 ? "cbo" : "abo",
            spend: Math.round(daily * (5 + Math.floor(Math.random() * 18))),
            roas: Math.round((1.5 + Math.random() * 4.5) * 10) / 10,
          });
        });
      }
      await admin.from("campaigns").insert(camps);
      return textContent(`Seed: ${clients?.length ?? 0} clientes, ${camps.length} campanhas.`);
    }

    // ---- Leitura ----
    case "kaira_account_summary": {
      const { data: clients, error: cErr } = await admin
        .from("clients").select("id, name, monthly_budget, status").eq("user_id", userId);
      if (cErr) throw new Error(cErr.message);
      const { data: camps, error: kErr } = await admin
        .from("campaigns").select("client_id, status, spend, roas").eq("user_id", userId);
      if (kErr) throw new Error(kErr.message);
      const round = (n: number) => Math.round(n * 100) / 100;
      const byClient = (clients ?? []).map((cl) => {
        const cc = (camps ?? []).filter((k) => k.client_id === cl.id);
        const spend = cc.reduce((s, k) => s + Number(k.spend ?? 0), 0);
        const withRoas = cc.filter((k) => Number(k.roas) > 0);
        const avgRoas = withRoas.length ? withRoas.reduce((s, k) => s + Number(k.roas), 0) / withRoas.length : 0;
        return {
          client: cl.name, status: cl.status, monthly_budget: Number(cl.monthly_budget ?? 0),
          campaigns: cc.length, total_spend: round(spend), avg_roas: round(avgRoas),
        };
      });
      const totals = {
        clients: clients?.length ?? 0, campaigns: camps?.length ?? 0,
        total_spend: round((camps ?? []).reduce((s, k) => s + Number(k.spend ?? 0), 0)),
      };
      return textContent(JSON.stringify({ totals, by_client: byClient }, null, 2));
    }
    case "kaira_list_campaigns": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("campaigns")
        .select("id, client_id, name, objective, status, budget, spend, roas, budget_type, budget_strategy")
        .eq("user_id", userId);
      if (args.client_id) q = q.eq("client_id", String(args.client_id));
      if (args.status) q = q.eq("status", String(args.status));
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ campaigns: data ?? [] }, null, 2));
    }
    case "kaira_list_ad_sets": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("ad_sets")
        .select("id, campaign_id, name, status, budget, budget_type").eq("user_id", userId);
      if (args.campaign_id) q = q.eq("campaign_id", String(args.campaign_id));
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ ad_sets: data ?? [] }, null, 2));
    }
    case "kaira_list_creatives": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("creatives")
        .select("id, ad_set_id, name, format, status, url, ctr, impressions, results, result_label, cost_per_result")
        .eq("user_id", userId);
      if (args.ad_set_id) q = q.eq("ad_set_id", String(args.ad_set_id));
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ creatives: data ?? [] }, null, 2));
    }
    case "kaira_list_audiences": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      const { data, error } = await admin.from("audiences")
        .select("id, name, description, gender, age_min, age_max, interests, status, size_estimate")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ audiences: data ?? [] }, null, 2));
    }
    case "kaira_list_calendar_notes": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("calendar_notes")
        .select("id, title, description, date, priority, done, link_type, link_id").eq("user_id", userId);
      if (args.from) q = q.gte("date", String(args.from));
      if (args.to) q = q.lte("date", String(args.to));
      if (args.only_pending) q = q.eq("done", false);
      const { data, error } = await q.order("date", { ascending: true }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ notes: data ?? [] }, null, 2));
    }
    case "kaira_list_tasks": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("ai_tasks")
        .select("id, title, description, priority, due_date, done, source").eq("user_id", userId);
      if (args.only_pending) q = q.eq("done", false);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ tasks: data ?? [] }, null, 2));
    }
    case "kaira_list_timeline": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      let q = admin.from("timeline_entries")
        .select("id, target_type, target_id, type, description, details, impact, occurred_at").eq("user_id", userId);
      if (args.target_type) q = q.eq("target_type", String(args.target_type));
      if (args.target_id) q = q.eq("target_id", String(args.target_id));
      const { data, error } = await q.order("occurred_at", { ascending: false }).limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ timeline: data ?? [] }, null, 2));
    }

    // ---- Criação ----
    case "kaira_create_ad_set": {
      const { data, error } = await admin.from("ad_sets").insert({
        user_id: userId, campaign_id: String(args.campaign_id), name: String(args.name),
        budget: optNum(args.budget) ?? 0, budget_type: opt(args.budget_type) ?? "daily",
        status: opt(args.status) ?? "active",
      }).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Ad set criado: ${data.name} (id: ${data.id})`);
    }
    case "kaira_create_creative": {
      const { data, error } = await admin.from("creatives").insert({
        user_id: userId, ad_set_id: String(args.ad_set_id), name: String(args.name),
        format: opt(args.format) ?? "image", status: opt(args.status) ?? "active",
        url: opt(args.url) ?? null, ctr: optNum(args.ctr) ?? 0,
        impressions: optNum(args.impressions) ?? 0, results: optNum(args.results) ?? 0,
        result_label: opt(args.result_label) ?? "conversas", cost_per_result: optNum(args.cost_per_result) ?? 0,
      }).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Criativo criado: ${data.name} (id: ${data.id})`);
    }
    case "kaira_create_task": {
      const { data, error } = await admin.from("ai_tasks").insert({
        user_id: userId, title: String(args.title),
        description: opt(args.description) ?? null, priority: opt(args.priority) ?? "medium",
        due_date: opt(args.due_date) ?? null, source: "mcp",
      }).select("id, title").single();
      if (error) throw new Error(error.message);
      return textContent(`Tarefa criada: ${data.title} (id: ${data.id})`);
    }
    case "kaira_link_audience_to_campaign": {
      const { error } = await admin.from("audience_campaigns").insert({
        user_id: userId, audience_id: String(args.audience_id), campaign_id: String(args.campaign_id),
      });
      if (error) throw new Error(error.message);
      return textContent(`Público ${args.audience_id} vinculado à campanha ${args.campaign_id}.`);
    }

    // ---- Atualização ----
    case "kaira_update_client":
      return ownedUpdate("clients", String(args.id), userId, {
        name: opt(args.name), industry: opt(args.industry), monthly_budget: optNum(args.monthly_budget),
        status: opt(args.status), notes: opt(args.notes),
      }, "Cliente");
    case "kaira_update_campaign":
      return ownedUpdate("campaigns", String(args.id), userId, {
        name: opt(args.name), objective: opt(args.objective), status: opt(args.status),
        budget: optNum(args.budget), spend: optNum(args.spend), roas: optNum(args.roas),
        budget_type: opt(args.budget_type), budget_strategy: opt(args.budget_strategy),
      }, "Campanha");
    case "kaira_update_ad_set":
      return ownedUpdate("ad_sets", String(args.id), userId, {
        name: opt(args.name), status: opt(args.status),
        budget: optNum(args.budget), budget_type: opt(args.budget_type),
      }, "Ad set");
    case "kaira_update_creative":
      return ownedUpdate("creatives", String(args.id), userId, {
        name: opt(args.name), status: opt(args.status), format: opt(args.format), url: opt(args.url),
        ctr: optNum(args.ctr), impressions: optNum(args.impressions), results: optNum(args.results),
        result_label: opt(args.result_label), cost_per_result: optNum(args.cost_per_result),
      }, "Criativo");
    case "kaira_update_audience":
      return ownedUpdate("audiences", String(args.id), userId, {
        name: opt(args.name), description: opt(args.description), gender: opt(args.gender),
        age_min: optNum(args.age_min), age_max: optNum(args.age_max), status: opt(args.status),
        size_estimate: optNum(args.size_estimate),
        interests: Array.isArray(args.interests) ? args.interests : undefined,
      }, "Público");
    case "kaira_set_calendar_note_done":
      return ownedUpdate("calendar_notes", String(args.id), userId, {
        done: args.done === undefined ? true : Boolean(args.done),
      }, "Nota");
    case "kaira_set_task_done":
      return ownedUpdate("ai_tasks", String(args.id), userId, {
        done: args.done === undefined ? true : Boolean(args.done),
      }, "Tarefa");

    // ---- Exclusão ----
    case "kaira_delete_client": return ownedDelete("clients", String(args.id), userId, "Cliente");
    case "kaira_delete_campaign": return ownedDelete("campaigns", String(args.id), userId, "Campanha");
    case "kaira_delete_ad_set": return ownedDelete("ad_sets", String(args.id), userId, "Ad set");
    case "kaira_delete_creative": return ownedDelete("creatives", String(args.id), userId, "Criativo");
    case "kaira_delete_audience": return ownedDelete("audiences", String(args.id), userId, "Público");
    case "kaira_delete_calendar_note": return ownedDelete("calendar_notes", String(args.id), userId, "Nota");
    case "kaira_delete_task": return ownedDelete("ai_tasks", String(args.id), userId, "Tarefa");

    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

async function handleRpc(req: JsonRpcReq, userId: string) {
  switch (req.method) {
    case "initialize":
      return rpcResult(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "kaira-mcp", version: "1.2.0" },
      });
    case "ping":
      return rpcResult(req.id, {});
    case "tools/list":
      return rpcResult(req.id, { tools: TOOLS });
    case "tools/call": {
      const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
      if (!params?.name) return rpcError(req.id, -32602, "tool name required");
      try {
        const result = await callTool(params.name, params.arguments ?? {}, userId);
        return rpcResult(req.id, result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return rpcResult(req.id, { isError: true, content: [{ type: "text", text: `Erro: ${msg}` }] });
      }
    }
    case "notifications/initialized":
      return null;
    default:
      return rpcError(req.id, -32601, `Method not found: ${req.method}`);
  }
}

// ============================================================
// OAuth 2.1 endpoints
// ============================================================

// RFC 9728 — OAuth Protected Resource Metadata
function protectedResourceMetadata() {
  return {
    resource: PUBLIC_MCP_URL,
    authorization_servers: [PUBLIC_APP_URL],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://gestorkaira.vercel.app/settings#connectors",
    resource_name: "Kaira",
    logo_uri: `${PUBLIC_APP_URL}/kaira-logo-96.png`,
  };
}

// RFC 8414 — OAuth Authorization Server Metadata
function authServerMetadata() {
  return {
    issuer: PUBLIC_APP_URL,
    authorization_endpoint: `${PUBLIC_APP_URL}/authorize`,
    token_endpoint: `${PUBLIC_MCP_URL}/token`,
    registration_endpoint: `${PUBLIC_MCP_URL}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
    logo_uri: `${PUBLIC_APP_URL}/kaira-logo-96.png`,
  };
}

// RFC 7591 — Dynamic Client Registration
async function handleRegister(req: Request) {
  let body: { client_name?: string; redirect_uris?: string[] } = {};
  try { body = await req.json(); } catch {}
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (redirectUris.length === 0) {
    return jsonResp({ error: "invalid_redirect_uri", error_description: "redirect_uris required" }, 400);
  }
  const clientId = randomToken("kac_", 16);
  await admin.from("oauth_clients").insert({
    client_id: clientId,
    client_name: body.client_name ?? "MCP Client",
    redirect_uris: redirectUris,
  });
  return jsonResp({
    client_id: clientId,
    client_name: body.client_name ?? "MCP Client",
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code"],
    response_types: ["code"],
    client_id_issued_at: Math.floor(Date.now() / 1000),
  }, 201);
}

// RFC 6749 §4.1.3 — Token endpoint (exchange code → access_token, PKCE)
async function handleToken(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  let params: Record<string, string> = {};
  if (ct.includes("application/json")) {
    try { params = await req.json(); } catch {}
  } else {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = String(v);
  }

  const grantType = params.grant_type;
  if (grantType !== "authorization_code") {
    return jsonResp({ error: "unsupported_grant_type" }, 400);
  }
  const code = params.code;
  const codeVerifier = params.code_verifier;
  const clientId = params.client_id;
  if (!code || !codeVerifier) {
    return jsonResp({ error: "invalid_request", error_description: "code and code_verifier required" }, 400);
  }

  const { data: codeRow, error } = await admin
    .from("oauth_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error || !codeRow) return jsonResp({ error: "invalid_grant", error_description: "code not found" }, 400);
  if (codeRow.used_at) return jsonResp({ error: "invalid_grant", error_description: "code already used" }, 400);
  if (new Date(codeRow.expires_at) < new Date()) return jsonResp({ error: "invalid_grant", error_description: "code expired" }, 400);
  if (clientId && codeRow.client_id !== clientId) return jsonResp({ error: "invalid_grant", error_description: "client_id mismatch" }, 400);

  // PKCE verify
  let challenge: string;
  if (codeRow.code_challenge_method === "S256") {
    challenge = await sha256b64url(codeVerifier);
  } else {
    challenge = codeVerifier;
  }
  if (challenge !== codeRow.code_challenge) {
    return jsonResp({ error: "invalid_grant", error_description: "PKCE verifier mismatch" }, 400);
  }

  // Marca code como usado
  await admin.from("oauth_codes").update({ used_at: new Date().toISOString() }).eq("code", code);

  // Gera access token
  const token = randomToken("kao_", 32);
  const tokenHash = await sha256hex(token);
  const { error: tokErr } = await admin.from("oauth_tokens").insert({
    user_id: codeRow.user_id,
    client_id: codeRow.client_id,
    token_hash: tokenHash,
    scope: codeRow.scope ?? "mcp",
  });
  if (tokErr) return jsonResp({ error: "server_error", error_description: tokErr.message }, 500);

  return jsonResp({
    access_token: token,
    token_type: "Bearer",
    expires_in: 180 * 24 * 60 * 60,
    scope: codeRow.scope ?? "mcp",
  });
}

// ============================================================
// Main router
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const path = getSuffix(url);

  // GET /.well-known/oauth-protected-resource
  if (req.method === "GET" && path === "/.well-known/oauth-protected-resource") {
    return jsonResp(protectedResourceMetadata());
  }
  // GET /.well-known/oauth-authorization-server
  if (req.method === "GET" && path === "/.well-known/oauth-authorization-server") {
    return jsonResp(authServerMetadata());
  }
  // POST /register (DCR)
  if (req.method === "POST" && path === "/register") {
    return handleRegister(req);
  }
  // POST /token
  if (req.method === "POST" && path === "/token") {
    return handleToken(req);
  }

  // GET / — health
  if (req.method === "GET" && (path === "/" || path === "")) {
    return jsonResp({ name: "kaira-mcp", version: "1.2.0", status: "ready" });
  }

  // POST / — MCP JSON-RPC (requires auth)
  if (req.method === "POST" && (path === "/" || path === "" || path === "/messages")) {
    const session = await authenticate(req);
    if (!session) {
      return new Response(
        JSON.stringify(rpcError(null, -32001, "Unauthorized")),
        {
          status: 401,
          headers: {
            ...cors,
            "Content-Type": "application/json",
            "WWW-Authenticate": `Bearer realm="kaira-mcp", error="invalid_token", resource_metadata="${PUBLIC_APP_URL}/.well-known/oauth-protected-resource"`,
          },
        },
      );
    }
    let body: JsonRpcReq | JsonRpcReq[];
    try { body = await req.json(); } catch {
      return jsonResp(rpcError(null, -32700, "Parse error"), 400);
    }
    const respond = (msg: JsonRpcReq) => handleRpc(msg, session.userId);
    if (Array.isArray(body)) {
      const responses = await Promise.all(body.map(respond));
      return jsonResp(responses.filter((r) => r !== null));
    }
    const resp = await respond(body);
    if (resp === null) return new Response(null, { status: 204, headers: cors });
    return jsonResp(resp);
  }

  return new Response("Not found", { status: 404, headers: cors });
});
