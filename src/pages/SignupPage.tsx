import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { KairaLogo } from "@/components/shared/KairaLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-login após signup (auto-confirm está ativo)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      toast({ title: "Conta criada!", description: "Faça login para continuar." });
      navigate("/login");
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
          <p className="text-muted-foreground text-sm mt-1">Comece a gerenciar como elite</p>
        </div>

        <div className="glass-card p-8">
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
