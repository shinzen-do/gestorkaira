import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Plug, Check, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { toast } from "sonner";

// OAuth 2.1 authorization endpoint — recebe parâmetros do MCP client
// (claude.ai etc.), valida sessão Supabase do usuário, mostra consent UI,
// chama RPC `create_oauth_code` no aprovar e redireciona pro callback do
// client com code+state.

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  mcp: "Ler e criar dados na sua conta Kaira via conector MCP (clientes, campanhas, públicos, calendário).",
};

export default function AuthorizePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const responseType = params.get("response_type") ?? "code";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const codeChallengeMethod = params.get("code_challenge_method") ?? "S256";
  const scope = params.get("scope") ?? "mcp";

  const [submitting, setSubmitting] = useState(false);

  const error = useMemo(() => {
    if (responseType !== "code") return "response_type deve ser 'code'.";
    if (!clientId) return "client_id ausente.";
    if (!redirectUri) return "redirect_uri ausente.";
    if (!codeChallenge) return "code_challenge ausente (PKCE obrigatório).";
    if (!["S256", "plain"].includes(codeChallengeMethod)) return "code_challenge_method inválido.";
    try { new URL(redirectUri); } catch { return "redirect_uri inválida."; }
    return null;
  }, [clientId, redirectUri, responseType, codeChallenge, codeChallengeMethod]);

  useEffect(() => {
    if (!authLoading && !user && !error) {
      const next = `/authorize?${params.toString()}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
    }
  }, [authLoading, user, error, navigate, params]);

  const approve = async () => {
    if (!user || error) return;
    setSubmitting(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc("create_oauth_code", {
        p_client_id: clientId,
        p_redirect_uri: redirectUri,
        p_code_challenge: codeChallenge,
        p_code_challenge_method: codeChallengeMethod,
        p_scope: scope,
      });
      if (rpcErr) throw rpcErr;
      const code = String(data);
      const url = new URL(redirectUri);
      url.searchParams.set("code", code);
      if (state) url.searchParams.set("state", state);
      window.location.replace(url.toString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Erro ao autorizar", { description: msg });
      setSubmitting(false);
    }
  };

  const deny = () => {
    if (!redirectUri) {
      navigate("/dashboard");
      return;
    }
    try {
      const url = new URL(redirectUri);
      url.searchParams.set("error", "access_denied");
      if (state) url.searchParams.set("state", state);
      window.location.replace(url.toString());
    } catch {
      navigate("/dashboard");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-card p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h1 className="font-display text-2xl text-foreground">Requisição inválida</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-2">
            <a href="/dashboard">Ir pro dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const clientName = clientId.startsWith("kac_") ? "Aplicativo externo" : clientId;
  const redirectHost = (() => { try { return new URL(redirectUri).host; } catch { return redirectUri; } })();
  const isClaudeAi = redirectHost.endsWith("claude.ai");
  const displayName = isClaudeAi ? "Claude.ai" : clientName;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--gold) / 0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(var(--cobalt) / 0.08), transparent 60%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md glass-card p-8 space-y-6"
      >
        <div className="flex items-center justify-center gap-4">
          <KairaLogo size={48} />
          <div className="text-muted-foreground">↔</div>
          <div className="w-12 h-12 rounded-xl bg-cobalt/10 border border-cobalt/30 flex items-center justify-center">
            <Plug className="w-6 h-6 text-cobalt" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Autorizar conector</p>
          <h1 className="font-display text-2xl text-foreground tracking-tight">
            {displayName} quer acessar sua conta Kaira
          </h1>
        </div>

        <div className="rounded-lg border border-glass-border bg-surface-1/50 p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Permissões solicitadas:</p>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-health-green shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              {SCOPE_DESCRIPTIONS[scope] ?? scope}
            </p>
          </div>
          <div className="flex items-start gap-2.5 pt-1 border-t border-border/50">
            <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Só sua conta ({user.email}). Você pode revogar a qualquer momento em{" "}
              <a href="/settings#connectors" className="text-cobalt hover:underline inline-flex items-center gap-0.5">
                Configurações → Conectores <ExternalLink className="w-2.5 h-2.5" />
              </a>
              .
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
            Redireciona depois pra: <span className="font-mono text-foreground/70">{redirectHost}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={deny} disabled={submitting} className="flex-1">
            Recusar
          </Button>
          <Button onClick={approve} disabled={submitting} className="flex-1 glow-cobalt gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Autorizar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
