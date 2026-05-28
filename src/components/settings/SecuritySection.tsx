import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "kaira_security_prompted";

function hasEmailPassword(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return false;
  const identities = (user as { identities?: Array<{ provider?: string }> }).identities ?? [];
  return identities.some((i) => i.provider === "email");
}

export function SecuritySection() {
  const { user } = useAuth();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const passwordSet = hasEmailPassword(user);

  const submit = async () => {
    if (pwd.length < 8) return toast.error("Senha precisa de ao menos 8 caracteres");
    if (pwd !== confirm) return toast.error("Senhas não conferem");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) {
      toast.error("Erro ao definir senha", { description: error.message });
      return;
    }
    toast.success("Senha definida", { description: "Agora você pode entrar com email + senha além do Google." });
    setPwd(""); setConfirm("");
    try { localStorage.setItem(STORAGE_KEY, "password-set"); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} id="security">
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 blur-xl bg-gold/20 rounded-full" aria-hidden />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Segurança da conta</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {passwordSet
                ? "Você pode entrar com Google ou email + senha. Trocar senha aqui se quiser."
                : "Você entrou via Google. Defina uma senha pra também poder entrar com email — útil se perder acesso ao Google."}
            </p>
          </div>
          {passwordSet && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-health-green/10 text-health-green border border-health-green/30 flex items-center gap-1 shrink-0">
              <Check className="w-3 h-3" /> Senha ativa
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{passwordSet ? "Nova senha" : "Senha"}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="pl-10 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPwd ? "Ocultar" : "Mostrar"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmar</Label>
            <Input
              id="confirm-password"
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>

          <Button onClick={submit} disabled={saving || pwd.length < 8 || pwd !== confirm} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {passwordSet ? "Trocar senha" : "Definir senha"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
