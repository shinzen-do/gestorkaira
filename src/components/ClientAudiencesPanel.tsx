import { useState } from "react";
import { Power, Plus, History, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { AddChangeDialog } from "./AddChangeDialog";
import { TimelineView } from "./TimelineView";
import { cn } from "@/lib/utils";

const genderLabel = { all: "Todos", male: "Masculino", female: "Feminino" } as const;

export function ClientAudiencesPanel({ clientId }: { clientId: string }) {
  const { audiences, audienceTimelines, toggleAudience } = useAppData();
  const list = audiences.filter((a) => a.clientId === clientId);
  const [showHistId, setShowHistId] = useState<string | null>(null);

  if (list.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        <Users className="w-5 h-5 mx-auto mb-2 opacity-50" />
        Nenhum público cadastrado para este cliente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((a) => {
        const showHist = showHistId === a.id;
        const hist = audienceTimelines[a.id] ?? [];
        return (
          <div key={a.id} className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-foreground">{a.name}</h4>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 border rounded-full font-medium px-2 py-0.5 text-[10px]",
                        a.status === "active"
                          ? "text-health-green bg-health-green/10 border-health-green/20"
                          : "text-muted-foreground bg-secondary border-border",
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", a.status === "active" ? "bg-health-green" : "bg-muted-foreground")} />
                      {a.status === "active" ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px]">
                    <span><span className="text-muted-foreground">Gênero: </span><span className="text-foreground font-medium">{genderLabel[a.gender]}</span></span>
                    <span><span className="text-muted-foreground">Idade: </span><span className="text-foreground font-medium">{a.ageMin}–{a.ageMax}</span></span>
                    {a.size !== undefined && (
                      <span><span className="text-muted-foreground">Tamanho: </span><span className="text-foreground font-medium">{a.size >= 1_000_000 ? `${(a.size / 1_000_000).toFixed(1)}M` : `${(a.size / 1000).toFixed(0)}k`}</span></span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.interests.map((i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-cobalt/10 text-cobalt border border-cobalt/20">{i}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setShowHistId(showHist ? null : a.id)} className={cn(showHist && "bg-secondary text-cobalt")}>
                    <History className="w-3.5 h-3.5" />
                  </Button>
                  <AddChangeDialog
                    targetType="audience"
                    targetId={a.id}
                    targetName={a.name}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                  <Button variant={a.status === "active" ? "outline" : "default"} size="sm" onClick={() => toggleAudience(a.id)}>
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {showHist && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
                  <div className="p-4">
                    {hist.length > 0 ? (
                      <TimelineView entries={hist} />
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma mudança registrada.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
