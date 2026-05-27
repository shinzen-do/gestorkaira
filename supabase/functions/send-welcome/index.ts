import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Edge function: envia e-mail de boas-vindas via Resend.
// Secret necessário no Supabase Edge:
//   supabase secrets set RESEND_API_KEY=re_... --project-ref vyfcfvozwizobnjsxnmq
// Domínio precisa estar verificado em https://resend.com/domains antes de produção.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "Kaira <boas-vindas@kaira.app>";
const SUBJECT = "Bem-vindo ao Kaira";

function html({ name, plan }: { name: string; plan: string }) {
  const isPaid = plan && plan !== "free";
  const planLabel: Record<string, string> = {
    pro_monthly: "Pro Mensal",
    pro_yearly: "Pro Anual",
    lifetime: "Vitalício Launch",
  };
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#f5f5f7;padding:40px 20px">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
      <tr><td>
        <p style="font-size:11px;letter-spacing:6px;color:#d4a766;margin:0 0 16px;text-transform:uppercase">KAIRA</p>
        <h1 style="font-size:24px;font-weight:600;color:#f5f5f7;margin:0 0 16px;line-height:1.3">
          Olá${name ? `, ${name}` : ""} — bem-vindo ao Kaira.
        </h1>
        <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 16px">
          Sua conta está pronta. A partir de agora você pode centralizar clientes, campanhas, públicos, criativos e pacing em um só lugar.
        </p>
        ${isPaid ? `<div style="background:#11131a;border:1px solid #3b6cff40;border-radius:8px;padding:16px;margin:24px 0">
          <p style="font-size:12px;color:#d4a766;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Plano selecionado</p>
          <p style="font-size:18px;font-weight:600;color:#f5f5f7;margin:0">${planLabel[plan] ?? plan}</p>
          <p style="font-size:12px;color:#a1a1aa;margin:8px 0 0">Seu acesso já está liberado. Em breve enviamos o link do checkout para garantir o plano.</p>
        </div>` : ""}
        <a href="https://kaira.app/dashboard" style="display:inline-block;background:#3b6cff;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;margin:8px 0 24px">Entrar no Kaira →</a>
        <p style="font-size:13px;line-height:1.6;color:#a1a1aa;margin:0 0 8px"><strong style="color:#f5f5f7">3 primeiros passos:</strong></p>
        <ol style="font-size:13px;line-height:1.7;color:#a1a1aa;margin:0;padding-left:20px">
          <li>Cadastre seu primeiro cliente em <em>Clientes</em>.</li>
          <li>Crie campanhas e conjuntos com orçamento — o Pacing já começa a calcular.</li>
          <li>Use o atalho <strong>⌘K</strong> (Ctrl+K) pra buscar qualquer coisa em segundos.</li>
        </ol>
        <p style="font-size:12px;line-height:1.6;color:#52525b;margin:40px 0 0;border-top:1px solid #1c1f29;padding-top:16px">
          Dúvidas? Responde este e-mail ou escreve em <a href="mailto:contato@kaira.app" style="color:#3b6cff;text-decoration:none">contato@kaira.app</a>.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, name, plan } = await req.json();
    if (!to || typeof to !== "string") return jsonResp({ error: "to required" }, 400);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return jsonResp({ error: "RESEND_API_KEY not configured" }, 500);

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: SUBJECT,
        html: html({ name: name ?? "", plan: plan ?? "free" }),
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return jsonResp({ error: "Resend error", detail }, resp.status);
    }
    const json = await resp.json();
    return jsonResp({ id: json.id });
  } catch (e) {
    return jsonResp({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
