import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu email")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(72, "Senha muito longa"),
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as "email" | "password";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message === "Email not confirmed"
          ? "Confirme seu email antes de entrar."
          : error.message;
      toast({ title: "Não foi possível entrar", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Acesso concedido", description: "Bem-vindo de volta ao Kaira." });
    navigate("/dashboard", { replace: true });
  };

  const handleForgotPassword = async () => {
    const emailCheck = z.string().email().safeParse(email.trim());
    if (!emailCheck.success) {
      setErrors({ email: "Informe um email válido para recuperar a senha" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-2 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cobalt/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[140px]" />

      {/* LEFT — Brand panel */}
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between p-12 relative border-r border-glass-border"
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Link to="/" className="inline-flex items-center gap-3 relative z-10 group">
          <KairaLogo size={40} />
          <span className="text-xl font-semibold tracking-tight">Kaira</span>
        </Link>

        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-glass-border bg-surface-2/50 text-xs text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Central de Comando · Ativa
            </div>
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              A precisão dos
              <br />
              <span className="bg-gradient-to-r from-cobalt to-gold bg-clip-text text-transparent">
                gestores de elite.
              </span>
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              Acesse seu cockpit operacional. Métricas, otimizações e histórico em
              um único ambiente — projetado para decisões rápidas.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { icon: Activity, label: "Saúde de conta em tempo real" },
              { icon: TrendingUp, label: "Tendências de CPA & ROAS" },
              { icon: ShieldCheck, label: "Criptografia e RLS de nível bancário" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-glass-border bg-surface-1/40 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-cobalt" />
                </div>
                <span className="text-sm text-foreground/90">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kaira. Todos os direitos reservados.
        </p>
      </motion.aside>

      {/* RIGHT — Form */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center px-6 py-12 relative z-10"
      >
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <KairaLogo size={40} />
              <span className="text-xl font-semibold">Kaira</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Acesse sua central de comando.
            </p>
          </div>

          <div className="glass-card p-8 backdrop-blur-xl">
            <GoogleSignInButton />

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-glass-border" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ou com email</span>
              <div className="h-px flex-1 bg-glass-border" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-11 bg-surface-2/60 border-glass-border focus-visible:ring-cobalt/40 ${
                      errors.email ? "border-destructive/60" : ""
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-cobalt hover:text-cobalt/80 transition-colors"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 h-11 bg-surface-2/60 border-glass-border focus-visible:ring-cobalt/40 ${
                      errors.password ? "border-destructive/60" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                  className="border-glass-border data-[state=checked]:bg-cobalt data-[state=checked]:border-cobalt"
                />
                <Label
                  htmlFor="remember"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Manter sessão ativa neste dispositivo
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 glow-cobalt group font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Entrar no Kaira
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Conexão criptografada · Sessão protegida por RLS</span>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ainda não tem acesso?{" "}
            <Link to="/signup" className="text-cobalt hover:underline font-medium">
              Solicitar conta
            </Link>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
