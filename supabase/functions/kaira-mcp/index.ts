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
];

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
        serverInfo: { name: "kaira-mcp", version: "1.1.0" },
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
    authorization_servers: [PUBLIC_MCP_URL],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://gestorkaira.vercel.app/settings#connectors",
  };
}

// RFC 8414 — OAuth Authorization Server Metadata
function authServerMetadata() {
  return {
    issuer: PUBLIC_MCP_URL,
    authorization_endpoint: `${PUBLIC_APP_URL}/authorize`,
    token_endpoint: `${PUBLIC_MCP_URL}/token`,
    registration_endpoint: `${PUBLIC_MCP_URL}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
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
    return jsonResp({ name: "kaira-mcp", version: "1.1.0", status: "ready" });
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
            "WWW-Authenticate": `Bearer realm="kaira-mcp", error="invalid_token"`,
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
