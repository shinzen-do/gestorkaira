import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/data/mockData";
import { Palette, DollarSign, Users, Zap, PauseCircle, StickyNote } from "lucide-react";

const typeConfig: Record<TimelineEntry["type"], { icon: React.ElementType; color: string; label: string }> = {
  creative: { icon: Palette, color: "text-cobalt", label: "Criativo" },
  budget: { icon: DollarSign, color: "text-gold", label: "Orçamento" },
  audience: { icon: Users, color: "text-primary", label: "Público" },
  bid: { icon: Zap, color: "text-accent", label: "Lance" },
  status: { icon: PauseCircle, color: "text-health-red", label: "Status" },
  note: { icon: StickyNote, color: "text-muted-foreground", label: "Nota" },
};

interface TimelineViewProps {
  entries: TimelineEntry[];
  filterType?: TimelineEntry["type"] | "all";
}

export function TimelineView({ entries, filterType = "all" }: TimelineViewProps) {
  const filtered = filterType === "all" ? entries : entries.filter((e) => e.type === filterType);

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nenhum registro encontrado.</p>;
  }

  return (
    <div className="relative space-y-1">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
      {filtered.map((entry, i) => {
        const cfg = typeConfig[entry.type];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-4 pl-0"
          >
            <div className={cn("z-10 w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border shrink-0", cfg.color)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <span className={cn("text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary", cfg.color)}>
                  {cfg.label}
                </span>
                {entry.impact && (
                  <span className={cn("text-[10px] font-medium",
                    entry.impact === "positive" ? "text-health-green" : entry.impact === "negative" ? "text-health-red" : "text-muted-foreground"
                  )}>
                    {entry.impact === "positive" ? "↑ Positivo" : entry.impact === "negative" ? "↓ Negativo" : "— Neutro"}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{entry.description}</p>
              {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
