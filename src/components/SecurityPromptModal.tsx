import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Smartphone, KeyRound, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "kaira_security_prompted";

export function SecurityPromptModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      try {
        const prompted = localStorage.getItem(STORAGE_KEY);
        if (prompted) return;
      } catch {
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled || error) return;
      const verified = [...(data.totp ?? []), ...(data.phone ?? [])].filter(
        (f) => f.status === "verified",
      );
      if (verified.length === 0) {
        window.setTimeout(() => !cancelled && setOpen(true), 1500);
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, "already-set");
        } catch {}
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user]);

  const dismiss = (markDone: boolean) => {
    if (markDone) {
      try { localStorage.setItem(STORAGE_KEY, "dismissed"); } catch {}
    }
    setOpen(false);
  };

  const goToSetup = () => {
    setOpen(false);
    navigate("/settings");
    window.setTimeout(() => {
      document.getElementById("security")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss(true)}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-glass-border">
        <div className="relative p-8 text-center">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--gold) / 0.15), transparent 70%)",
            }}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-flex mb-5"
          >
            <div className="absolute inset-0 blur-2xl bg-gold/30 rounded-full" aria-hidden />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-gold/5 border border-gold/40 flex items-center justify-center shadow-[inset_0_1px_0_0_hsl(var(--gold)/0.3)]">
              <ShieldCheck className="w-7 h-7 text-gold" strokeWidth={1.5} />
            </div>
          </motion.div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-3">Boas-vindas ao Kaira</p>
          <h2 className="font-display text-3xl text-foreground tracking-tight mb-3">
            Proteja sua conta
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6">
            Gestores de tráfego mexem com dados de cliente e contas com gasto real. Ative 2FA agora — leva 30 segundos.
          </p>

          <div className="space-y-2 mb-6">
            <button
              onClick={goToSetup}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-glass-border bg-surface-1/60 hover:border-gold-soft transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Aplicativo autenticador (TOTP)</p>
                <p className="text-[11px] text-muted-foreground">Google Authenticator, Authy, 1Password</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
            </button>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-secondary/20 text-left opacity-60 cursor-not-allowed">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Passkey (em breve)</p>
                <p className="text-[11px] text-muted-foreground">Biometria do celular ou chave de segurança</p>
              </div>
            </div>
          </div>

          <Button variant="ghost" onClick={() => dismiss(true)} className="text-xs text-muted-foreground hover:text-foreground">
            Pular por enquanto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
