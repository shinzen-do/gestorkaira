import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface DailySpend { id: string; monthly_budget_id: string; day: number; spent_so_far: number; recorded_at: string; }
interface MB { id: string; client_id: string; total_budget: number; }

export function PacingAlertsBanner() {
  const { clients } = useAppData();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<MB[]>([]);
  const [spends, setSpends] = useState<DailySpend[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const today = new Date();
      const { data: bData } = await supabase
        .from("monthly_budgets")
        .select("id, client_id, total_budget")
        .eq("year", today.getFullYear())
        .eq("month", today.getMonth() + 1);

      const budgetsRows = (bData ?? []) as MB[];
      setBudgets(budgetsRows);

      if (budgetsRows.length === 0) {
        setSpends([]);
        return;
      }

      const { data: sData } = await supabase
        .from("daily_spends")
        .select("*")
        .in("monthly_budget_id", budgetsRows.map((b) => b.id));
      setSpends((sData ?? []) as DailySpend[]);
    })();
  }, [user]);

  const alerts = useMemo(() => {
    const today = new Date();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const out: { name: string; status: "above" | "below"; diff: number }[] = [];
    for (const c of clients) {
      const b = budgets.find((x) => x.client_id === c.id);
      if (!b || b.total_budget <= 0) continue;
      const cs = spends.filter((s) => s.monthly_budget_id === b.id).sort((a, b2) => new Date(b2.recorded_at).getTime() - new Date(a.recorded_at).getTime());
      if (cs.length === 0) continue;
      const last = cs[0];
      const pctSpent = (last.spent_so_far / b.total_budget) * 100;
      const pctMonth = (last.day / totalDays) * 100;
      const diff = pctSpent - pctMonth;
      if (Math.abs(diff) > 10) out.push({ name: c.name, status: diff > 0 ? "above" : "below", diff });
    }
    return out;
  }, [clients, budgets, spends]);

  if (alerts.length === 0) return null;
  return (
    <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{alerts.length} cliente(s) com pacing fora do padrão</p>
        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
          {alerts.slice(0, 5).map((a) => (
            <li key={a.name}><strong className={a.status === "above" ? "text-destructive" : "text-yellow-400"}>{a.name}</strong> — {a.status === "above" ? "acima" : "abaixo"} do ritmo ({a.diff > 0 ? "+" : ""}{a.diff.toFixed(1)}%)</li>
          ))}
        </ul>
        <Link to="/pacing" className="text-xs text-cobalt hover:underline mt-2 inline-block">Abrir Pacing →</Link>
      </div>
    </div>
  );
}
