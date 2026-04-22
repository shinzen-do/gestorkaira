import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TimelineView } from "@/components/TimelineView";
import { clients } from "@/data/mockData";
import type { TimelineEntry } from "@/data/mockData";

const types = ["all", "creative", "budget", "audience", "bid", "status", "note"] as const;
const typeLabels: Record<string, string> = {
  all: "Todos",
  creative: "Criativo",
  budget: "Orçamento",
  audience: "Público",
  bid: "Lance",
  status: "Status",
  note: "Nota",
};

export default function TimelinePage() {
  const [filter, setFilter] = useState<TimelineEntry["type"] | "all">("all");

  const allEntries = useMemo(() => {
    const entries: (TimelineEntry & { source: string })[] = [];
    clients.forEach((client) => {
      client.campaigns.forEach((camp) => {
        camp.timeline.forEach((t) => entries.push({ ...t, source: `${client.name} › ${camp.name}` }));
        camp.adSets.forEach((as) => {
          as.timeline.forEach((t) => entries.push({ ...t, source: `${client.name} › ${camp.name} › ${as.name}` }));
        });
      });
    });
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const filtered = filter === "all" ? allEntries : allEntries.filter((e) => e.type === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Histórico de Alterações</h1>
        <p className="text-sm text-muted-foreground mt-1">Timeline completa de todas as mudanças em campanhas e CAs</p>
      </motion.div>

      <div className="flex gap-1.5 flex-wrap">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === t ? "bg-cobalt text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro com este filtro.</p>
        ) : (
          <div className="space-y-0">
            {filtered.map((entry, i) => (
              <div key={entry.id + i}>
                <p className="text-[10px] text-muted-foreground ml-12 mb-1 uppercase tracking-wider">{(entry as any).source}</p>
                <TimelineView entries={[entry]} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
