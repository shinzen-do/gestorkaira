import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Edge function: recebe webhook da Cakto e ativa o plano do usuário.
// Secrets necessários:
//   CAKTO_WEBHOOK_SECRET   — segredo compartilhado pra validar assinatura
//   SUPABASE_URL           — auto-injetado pelo Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injetado pelo Supabase
//
// Eventos esperados da Cakto (confirmar payload exato no painel):
//   { event: "purchase.completed" | "purchase.refunded",
//     data: { customer: { email }, product_id, amount, ... } }
//
// Mapeamento de product_id → plano. Atualizar quando criar os 4 produtos na Cakto.
const PRODUCT_TO_PLAN: Record<string, string> = {
  // "cakto_product_id_pro_monthly": "pro_monthly",
  // "cakto_product_id_pro_yearly":  "pro_yearly",
  // "cakto_product_id_lifetime":    "lifetime",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cakto-signature",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  try {
    const raw = await req.text();
    const secret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    const signature = req.headers.get("x-cakto-signature");

    // TODO: confirmar formato real da assinatura quando integrar a Cakto.
    // Cakto envia HMAC do body. Validar antes de processar.
    if (secret && signature && signature !== secret) {
      return jsonResp({ error: "invalid signature" }, 401);
    }

    const payload = JSON.parse(raw);
    const event = payload.event as string | undefined;
    const data = payload.data ?? {};
    const email = data.customer?.email as string | undefined;
    const productId = data.product_id as string | undefined;

    if (!event || !email) return jsonResp({ error: "missing event or email" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Localiza o user pelo e-mail (case-insensitive).
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) return jsonResp({ error: "could not list users", detail: listErr.message }, 500);
    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return jsonResp({ error: "user not found for email", email }, 404);

    if (event === "purchase.completed") {
      const plan = productId ? PRODUCT_TO_PLAN[productId] ?? "pro_monthly" : "pro_monthly";
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, /* TODO: adicionar colunas: */ /* current_plan: plan, plan_active_until: ... */ }, { onConflict: "user_id" });
      if (error) return jsonResp({ error: "could not update settings", detail: error.message }, 500);

      // Dispara e-mail de confirmação (opcional)
      // await fetch(`${SUPABASE_URL}/functions/v1/send-welcome`, { ... })

      return jsonResp({ ok: true, plan, user_id: user.id });
    }

    if (event === "purchase.refunded") {
      // TODO: marcar plano como cancelado / downgrade pro free
      return jsonResp({ ok: true, action: "refunded", user_id: user.id });
    }

    return jsonResp({ ok: true, ignored: event });
  } catch (e) {
    return jsonResp({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
