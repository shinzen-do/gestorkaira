import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { readUtm, trackPixel } from "@/lib/tracking";

const PLAN_INFO: Record<string, { label: string; price: string; tagline: string; icon: typeof Crown }> = {
  pro_monthly: { label: "Pro Mensal", price: "R$ 47/mês", tagline: "Cobrança após cadastro confirmado", icon: Sparkles },
  pro_yearly: { label: "Pro Anual", price: "R$ 470/ano", tagline: "2 meses grátis vs mensal", icon: Sparkles },
  lifetime: { label: "Vitalício Launch", price: "R$ 497 único", tagline: "Edição fundador — limitada a 50 vagas", icon: Crown },
};

export default function SignupPage() {
  const [params] = useSearchParams();
  const selectedPlan = params.get("plan") ?? null;
  const planInfo = selectedPlan ? PLAN_INFO[selectedPlan] : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "Senha fraca", description: "Use ao menos 8 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const utm = readUtm();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          intended_plan: selectedPlan ?? "free",
          ...(Object.keys(utm).length > 0 ? { utm } : {}),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Tracking de conversão
    trackPixel("CompleteRegistration", { plan: selectedPlan ?? "free" });

    // Auto-login após signup (auto-confirm está ativo)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      toast({ title: "Conta criada!", description: "Faça login para continuar." });
      navigate("/login");
    } else if (selectedPlan && selectedPlan !== "free") {
      toast({
        title: "Vaga reservada",
        description: "Liberamos seu acesso. O checkout do plano vai abrir em breve — vamos avisar por email.",
      });
      navigate("/dashboard");
    } else {
      toast({ title: "Bem-vindo ao Kaira", description: "Sua conta foi criada com sucesso." });
      navigate("/dashboard");
    }
    setLoading(false);
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
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <KairaLogo size={48} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Crie sua conta</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {planInfo ? `Plano selecionado: ${planInfo.label}` : "Comece a gerenciar como elite"}
          </p>
        </div>

        {planInfo && (
          <div className="glass-card p-4 mb-4 border-cobalt/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-cobalt/10 flex items-center justify-center flex-shrink-0">
                <planInfo.icon className="w-4 h-4 text-cobalt" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{planInfo.label}</p>
                  <p className="text-sm text-gold font-tabular">{planInfo.price}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{planInfo.tagline}</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-8">
          <GoogleSignInButton label="Cadastrar com Google" />

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ou com email</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-surface-2 border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-surface-2 border-glass-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-surface-2 border-glass-border"
              />
            </div>
            <Button type="submit" className="w-full glow-cobalt" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-cobalt hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
