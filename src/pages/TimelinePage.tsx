import { useMemo } from "react";
import { motion } from "framer-motion";
import { History, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAppData, type TimelineEntry } from "@/contexts/AppDataContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const typeLabels: Record<TimelineEntry["type"], string> = {
  creative: "Criativo", budget: "Orçamento", audience: "Público",
  bid: "Lance", status: "Status", note: "Nota",
};

export default function TimelinePage() {
  const { timelineEntries, clients, campaigns, adSets, audiences, loading } = useAppData();

  const enriched = useMemo(() => {
    return timelineEntries.map((t) => {
      let context = "";
      if (t.target_type === "client") context = clients.find((c) => c.id === t.target_id)?.name ?? "Cliente";
      else if (t.target_type === "campaign") {
        const c = campaigns.find((x) => x.id === t.target_id);
        const cl = c ? clients.find((x) => x.id === c.client_id) : null;
        context = `${cl?.name ?? ""} › ${c?.name ?? "Campanha"}`;
      } else if (t.target_type === "adset") {
        const a = adSets.find((x) => x.id === t.target_id);
        const c = a ? campaigns.find((x) => x.id === a.campaign_id) : null;
        const cl = c ? clients.find((x) => x.id === c.client_id) : null;
        context = `${cl?.name ?? ""} › ${c?.name ?? ""} › ${a?.name ?? "Conjunto"}`;
      } else if (t.target_type === "audience") {
        context = `Público · ${audiences.find((a) => a.id === t.target_id)?.name ?? ""}`;
      }
      return { ...t, context };
    });
  }, [timelineEntries, clients, campaigns, adSets, audiences]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">Todas as mudanças registradas em clientes, campanhas, conjuntos e públicos.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : enriched.length === 0 ? (
        <EmptyState icon={History} title="Sem registros"
          description="Use o ícone de histórico em qualquer cliente, campanha ou conjunto para registrar mudanças." />
      ) : (
        <div className="space-y-2">
          {enriched.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
              className="glass-card p-4 flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                e.impact === "positive" ? "bg-health-green/15 text-health-green" :
                e.impact === "negative" ? "bg-destructive/15 text-destructive" :
                "bg-muted text-muted-foreground")}>
                {e.impact === "positive" ? <ArrowUp className="w-4 h-4" /> : e.impact === "negative" ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">{typeLabels[e.type]}</span>
                  <span className="text-[11px] text-muted-foreground">{e.context}</span>
                </div>
                <p className="text-sm text-foreground mt-1">{e.description}</p>
                {e.details && <p className="text-xs text-muted-foreground mt-1">{e.details}</p>}
                <p className="text-[10px] text-muted-foreground mt-1.5">{format(parseISO(e.occurred_at), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
