import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface PlanInfo {
  key: "pro_monthly" | "pro_yearly" | "lifetime";
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
}

interface Props {
  plan: PlanInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingCheckoutModal({ plan, open, onOpenChange }: Props) {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const proceed = () => {
    if (!plan || !accepted) return;
    onOpenChange(false);
    setAccepted(false);
    navigate(`/signup?plan=${plan.key}`);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-glass-border">
        <div className="relative p-7">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--gold) / 0.12), transparent 70%)",
            }}
          />

          <DialogHeader className="relative">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">Confirmar plano</p>
            <DialogTitle className="font-display text-2xl tracking-tight">{plan.name}</DialogTitle>
            <DialogDescription className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-5 space-y-2 mb-5">
            {plan.features.slice(0, 4).map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span>{f}</span>
              </motion.div>
            ))}
          </div>

          <p className="relative text-[11px] text-muted-foreground mb-4 leading-relaxed">
            {plan.tagline}
          </p>

          <label className="relative flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/40 cursor-pointer select-none mb-4">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-glass-border accent-cobalt cursor-pointer shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              Li e aceito os{" "}
              <Link to="/termos" target="_blank" className="text-cobalt hover:underline">Termos de Uso</Link>,
              {" "}a{" "}
              <Link to="/privacidade" target="_blank" className="text-cobalt hover:underline">Política de Privacidade</Link>
              {" "}e a{" "}
              <Link to="/reembolso" target="_blank" className="text-cobalt hover:underline">Política de Reembolso</Link>
              .
            </span>
          </label>

          <Button onClick={proceed} disabled={!accepted} className="relative w-full glow-cobalt gap-2">
            <Lock className="w-4 h-4" />
            Continuar pro checkout
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="relative text-[10px] text-muted-foreground text-center mt-3">
            Pagamento processado por Cakto · PIX, cartão e boleto
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
