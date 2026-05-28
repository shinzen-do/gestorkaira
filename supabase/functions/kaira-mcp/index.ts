// MCP server (Model Context Protocol) pra Kaira.
// Implementa transport HTTP simples (POST /mcp recebe JSON-RPC, retorna JSON-RPC).
// Auth via Bearer token = API key gerada pelo usuário em Settings → Conectores.
//
// Compatível com Claude.ai custom connectors (HTTP streamable transport).
// URL: https://vyfcfvozwizobnjsxnmq.supabase.co/functions/v1/kaira-mcp
//
// Endpoints:
//   POST /  ou  POST /messages  — recebe requisição JSON-RPC do MCP client.
//
// Métodos MCP suportados:
//   - initialize
//   - tools/list
//   - tools/call
//   - ping

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// Auth
// ============================================================

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticate(req: Request): Promise<{ userId: string; keyId: string } | null> {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token.startsWith("kaira_")) return null;
  const hash = await sha256(token);
  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;
  // touch last_used_at (fire and forget)
  admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(
    () => {},
    () => {},
  );
  return { userId: data.user_id, keyId: data.id };
}

// ============================================================
// JSON-RPC helpers
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

// ============================================================
// MCP tools
// ============================================================

const TOOLS = [
  {
    name: "kaira_list_clients",
    description: "Lista todos os clientes do usuário. Use isso primeiro pra saber o que existe antes de criar duplicados.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Máximo de clientes (default 50)" },
      },
    },
  },
  {
    name: "kaira_create_client",
    description: "Cria um cliente. Use nomes realistas de empresa brasileira.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome do cliente (ex: Acme Cosméticos)" },
        industry: { type: "string", description: "Setor/nicho (ex: E-commerce, Saúde, Imobiliário)" },
        monthly_budget: { type: "number", description: "Orçamento mensal em R$" },
        notes: { type: "string", description: "Anotações livres" },
      },
      required: ["name"],
    },
  },
  {
    name: "kaira_create_campaign",
    description: "Cria campanha vinculada a um cliente. Pegue client_id via kaira_list_clients.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "UUID do cliente" },
        name: { type: "string", description: "Nome da campanha (ex: Black Friday Conversão)" },
        objective: { type: "string", description: "Objetivo (Vendas, Leads, Conversão, Tráfego, Engajamento, Reconhecimento, Mensagens)" },
        budget: { type: "number", description: "Orçamento R$" },
        budget_type: { type: "string", enum: ["daily", "total"], description: "Tipo de orçamento" },
        budget_strategy: { type: "string", enum: ["cbo", "abo"], description: "CBO (campanha) ou ABO (conjunto)" },
        spend: { type: "number", description: "Quanto já foi gasto (R$)" },
        roas: { type: "number", description: "ROAS atual (ex: 3.4)" },
      },
      required: ["client_id", "name"],
    },
  },
  {
    name: "kaira_create_audience",
    description: "Cria público com gênero, faixa etária e interesses.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome do público (ex: Mães 28-42 skincare)" },
        description: { type: "string" },
        gender: { type: "string", enum: ["all", "male", "female"] },
        age_min: { type: "number", description: "Idade mínima (ex: 25)" },
        age_max: { type: "number", description: "Idade máxima (ex: 45)" },
        interests: { type: "array", items: { type: "string" }, description: "Lista de interesses" },
        size_estimate: { type: "number", description: "Estimativa de tamanho" },
      },
      required: ["name"],
    },
  },
  {
    name: "kaira_add_calendar_note",
    description: "Adiciona nota/lembrete no calendário em uma data específica.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["title", "date"],
    },
  },
  {
    name: "kaira_seed_demo_data",
    description: "Popula a conta com dados realistas pra demo (5 clientes, 15 campanhas, públicos, calendar). Use só uma vez por conta. Idempotente: não duplica se já existirem dados.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ============================================================
// Tool handlers
// ============================================================

async function callTool(name: string, args: Record<string, unknown>, userId: string) {
  switch (name) {
    case "kaira_list_clients": {
      const limit = Math.min(Number(args.limit ?? 50), 200);
      const { data, error } = await admin
        .from("clients")
        .select("id, name, industry, monthly_budget, status, notes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return textContent(JSON.stringify({ clients: data ?? [] }, null, 2));
    }

    case "kaira_create_client": {
      const payload = {
        user_id: userId,
        name: String(args.name),
        industry: args.industry ? String(args.industry) : null,
        monthly_budget: Number(args.monthly_budget ?? 0),
        notes: args.notes ? String(args.notes) : null,
      };
      const { data, error } = await admin.from("clients").insert(payload).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Cliente criado: ${data.name} (id: ${data.id})`);
    }

    case "kaira_create_campaign": {
      const payload = {
        user_id: userId,
        client_id: String(args.client_id),
        name: String(args.name),
        objective: args.objective ? String(args.objective) : null,
        budget: Number(args.budget ?? 0),
        budget_type: (args.budget_type as string) ?? "daily",
        budget_strategy: (args.budget_strategy as string) ?? "abo",
        spend: Number(args.spend ?? 0),
        roas: Number(args.roas ?? 0),
      };
      const { data, error } = await admin.from("campaigns").insert(payload).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Campanha criada: ${data.name} (id: ${data.id})`);
    }

    case "kaira_create_audience": {
      const payload = {
        user_id: userId,
        name: String(args.name),
        description: args.description ? String(args.description) : null,
        gender: (args.gender as string) ?? "all",
        age_min: Number(args.age_min ?? 18),
        age_max: Number(args.age_max ?? 65),
        interests: Array.isArray(args.interests) ? args.interests : [],
        size_estimate: args.size_estimate ? Number(args.size_estimate) : null,
      };
      const { data, error } = await admin.from("audiences").insert(payload).select("id, name").single();
      if (error) throw new Error(error.message);
      return textContent(`Público criado: ${data.name} (id: ${data.id})`);
    }

    case "kaira_add_calendar_note": {
      const payload = {
        user_id: userId,
        title: String(args.title),
        description: args.description ? String(args.description) : null,
        date: String(args.date),
        priority: (args.priority as string) ?? "medium",
        link_type: "none",
        link_id: null,
      };
      const { data, error } = await admin.from("calendar_notes").insert(payload).select("id, title").single();
      if (error) throw new Error(error.message);
      return textContent(`Nota criada: ${data.title} (id: ${data.id})`);
    }

    case "kaira_seed_demo_data": {
      // Idempotência: skipa se já tem ≥3 clientes
      const { count } = await admin.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if ((count ?? 0) >= 3) {
        return textContent(`Conta já tem ${count} clientes. Skip seed.`);
      }

      const demoClients = [
        { name: "Acme Cosméticos", industry: "E-commerce beauty", monthly_budget: 8000 },
        { name: "Studio Pilates Vida", industry: "Saúde / Wellness", monthly_budget: 3500 },
        { name: "Imobiliária Horizonte", industry: "Imobiliário", monthly_budget: 12000 },
        { name: "DentalCare Sorrisos", industry: "Saúde / Odonto", monthly_budget: 4500 },
        { name: "Aurora Moda Íntima", industry: "E-commerce moda", monthly_budget: 6000 },
      ];

      const clientRows = demoClients.map((c) => ({ ...c, user_id: userId }));
      const { data: clients, error: cErr } = await admin.from("clients").insert(clientRows).select("id, name, monthly_budget");
      if (cErr) throw new Error(cErr.message);

      const campaigns: Array<{ user_id: string; client_id: string; name: string; objective: string; budget: number; budget_type: string; budget_strategy: string; spend: number; roas: number }> = [];
      const campaignsByClient: Record<string, string[]> = {
        "Acme Cosméticos": ["Black Friday — Conversão", "Aquecimento BF — Engajamento", "Remarketing AOV"],
        "Studio Pilates Vida": ["Captação Alunos — Leads", "Aniversariantes do Mês"],
        "Imobiliária Horizonte": ["Lançamento Edifício Aurora", "Apartamentos Beira-mar", "Investidores Premium"],
        "DentalCare Sorrisos": ["Clareamento — Promoção Set", "Ortodontia Adultos"],
        "Aurora Moda Íntima": ["Linha Renda Verão", "Dia das Mães — Antecipa"],
      };
      const objectives = ["Vendas", "Conversão", "Leads", "Tráfego", "Engajamento"];
      for (const c of clients ?? []) {
        const names = campaignsByClient[c.name] ?? [];
        names.forEach((n, i) => {
          const dailyBudget = Math.round((c.monthly_budget / 30) * (0.6 + Math.random() * 0.6));
          const spend = Math.round(dailyBudget * (5 + Math.floor(Math.random() * 18)));
          campaigns.push({
            user_id: userId,
            client_id: c.id,
            name: n,
            objective: objectives[i % objectives.length],
            budget: dailyBudget,
            budget_type: "daily",
            budget_strategy: i === 0 ? "cbo" : "abo",
            spend,
            roas: Math.round((1.5 + Math.random() * 4.5) * 10) / 10,
          });
        });
      }
      const { error: campErr } = await admin.from("campaigns").insert(campaigns);
      if (campErr) throw new Error(campErr.message);

      const audiences = [
        { name: "Mães 28-42 · skincare premium", gender: "female", age_min: 28, age_max: 42, interests: ["skincare", "anti-idade", "maternidade", "luxo"], size_estimate: 850000 },
        { name: "Mulheres 35+ · wellness", gender: "female", age_min: 35, age_max: 55, interests: ["pilates", "yoga", "saúde", "longevidade"], size_estimate: 620000 },
        { name: "Investidores imóveis 30-55", gender: "all", age_min: 30, age_max: 55, interests: ["investimentos", "imóveis", "renda passiva", "bolsa"], size_estimate: 420000 },
        { name: "Casais buscando primeiro lar", gender: "all", age_min: 25, age_max: 38, interests: ["casamento", "primeiro imóvel", "decoração"], size_estimate: 380000 },
        { name: "Lookalike compradores Acme", gender: "all", age_min: 22, age_max: 55, interests: ["beleza", "moda", "skincare"], size_estimate: 1200000 },
      ].map((a) => ({ ...a, user_id: userId }));
      await admin.from("audiences").insert(audiences);

      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const notes = [
        { title: "Revisar criativos Acme", days: 1, priority: "high" },
        { title: "Subir lookalike novo — Aurora", days: 2, priority: "medium" },
        { title: "Reunião alinhamento Horizonte", days: 3, priority: "high" },
        { title: "Pausar campanha BF e analisar", days: 5, priority: "medium" },
        { title: "Briefing nova campanha DentalCare", days: 7, priority: "low" },
      ].map((n) => {
        const d = new Date(today);
        d.setDate(d.getDate() + n.days);
        return {
          user_id: userId,
          title: n.title,
          date: fmt(d),
          priority: n.priority,
          link_type: "none",
          link_id: null,
        };
      });
      await admin.from("calendar_notes").insert(notes);

      return textContent(
        `Seed criado: ${clients?.length ?? 0} clientes, ${campaigns.length} campanhas, ${audiences.length} públicos, ${notes.length} notas.`,
      );
    }

    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

// ============================================================
// HTTP handler
// ============================================================

async function handleRpc(req: JsonRpcReq, userId: string) {
  switch (req.method) {
    case "initialize":
      return rpcResult(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "kaira-mcp", version: "1.0.0" },
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
      // notification (no id) — no response needed
      return null;

    default:
      return rpcError(req.id, -32601, `Method not found: ${req.method}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  if (req.method === "GET") {
    // Health check
    return new Response(
      JSON.stringify({ name: "kaira-mcp", version: "1.0.0", status: "ready" }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const session = await authenticate(req);
  if (!session) {
    return new Response(
      JSON.stringify(rpcError(null, -32001, "Unauthorized — API key inválida ou revogada")),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  let body: JsonRpcReq | JsonRpcReq[];
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, -32700, "Parse error")),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const respond = async (msg: JsonRpcReq) => {
    return await handleRpc(msg, session.userId);
  };

  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map(respond));
    return new Response(JSON.stringify(responses.filter((r) => r !== null)), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const resp = await respond(body);
  if (resp === null) {
    return new Response(null, { status: 204, headers: cors });
  }
  return new Response(JSON.stringify(resp), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
