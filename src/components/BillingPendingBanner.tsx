import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PLAN_DISPLAY: Record<string, { label: string; price: string; icon: typeof Crown }> = {
  pro_monthly: { label: "Pro Mensal", price: "R$ 47/mês", icon: Sparkles },
  pro_yearly: { label: "Pro Anual", price: "R$ 470/ano", icon: Sparkles },
  lifetime: { label: "Vitalício Launch", price: "R$ 497 único", icon: Crown },
};

export function BillingPendingBanner() {
  const { user } = useAuth();
  const intended = user?.user_metadata?.intended_plan as string | undefined;
  if (!intended || intended === "free") return null;

  const plan = PLAN_DISPLAY[intended];
  if (!plan) return null;

  return (
    <div className="rounded-xl border border-cobalt/30 bg-cobalt/5 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-cobalt/15 flex items-center justify-center flex-shrink-0">
        <plan.icon className="w-4 h-4 text-cobalt" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Vaga reservada — {plan.label}</p>
          <p className="text-xs text-gold font-tabular whitespace-nowrap">{plan.price}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Seu acesso completo já está liberado. Quando o checkout abrir, vamos te avisar por email.
          Continue cadastrando clientes e campanhas normalmente.
        </p>
      </div>
    </div>
  );
}
