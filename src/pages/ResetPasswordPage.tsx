import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { KairaLogo } from "@/components/shared/KairaLogo";

type Stage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detecta o token de recuperação automaticamente.
  // Supabase v2 dispara onAuthStateChange com event === "PASSWORD_RECOVERY" quando o usuário
  // chega via link de email. Também tratamos o caso de erro no hash (token expirado/inválido).
  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (hash.includes("error") || search.includes("error")) {
      setStage("invalid");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setStage("ready");
      } else if (event === "SIGNED_IN" && session) {
        // Usuário já autenticado entrou direto na página: permite trocar senha.
        setStage((s) => (s === "checking" ? "ready" : s));
      }
    });

    // Fallback: se já existe sessão (link recém-clicado), libera o formulário.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStage((s) => {
        if (s !== "checking") return s;
        return session ? "ready" : "invalid";
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha fraca", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Senhas diferentes", description: "As duas senhas precisam ser iguais.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }
    setStage("done");
    await supabase.auth.signOut();
    setTimeout(() => navigate("/login", { replace: true }), 1800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cobalt/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <KairaLogo size={36} withText />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Redefinir senha</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stage === "ready" && "Defina uma nova senha para sua conta Kaira"}
            {stage === "checking" && "Verificando seu link..."}
            {stage === "invalid" && "Link inválido ou expirado"}
            {stage === "done" && "Pronto!"}
          </p>
        </div>

        <div className="glass-card p-8">
          {stage === "checking" && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {stage === "invalid" && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                Este link de redefinição não é mais válido. Solicite um novo a partir da tela de login.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </div>
          )}

          {stage === "done" && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Senha atualizada com sucesso. Redirecionando para o login...
              </p>
            </div>
          )}

          {stage === "ready" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10 bg-surface-2 border-glass-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={show ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-surface-2 border-glass-border"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full glow-cobalt" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
              </Button>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Sua senha é criptografada antes de ser salva.</span>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
