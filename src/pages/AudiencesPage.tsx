import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, History, Plus, Power, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { AddChangeDialog } from "@/components/AddChangeDialog";
import { TimelineView } from "@/components/TimelineView";
import { cn } from "@/lib/utils";

const genderLabel = { all: "Todos", male: "Masculino", female: "Feminino" } as const;

export default function AudiencesPage() {
  const { audiences, audienceTimelines, toggleAudience, clients } = useAppData();
  const [params] = useSearchParams();
  const focusId = params.get("focus");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [expandedId, setExpandedId] = useState<string | null>(focusId);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (focusId) {
      setExpandedId(focusId);
      const el = document.getElementById(`audience-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId]);

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return audiences.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        a.interests.some((i) => i.toLowerCase().includes(term)) ||
        clientName(a.clientId).toLowerCase().includes(term)
      );
    });
  }, [audiences, statusFilter, query, clients]);

  const stats = {
    total: audiences.length,
    active: audiences.filter((a) => a.status === "active").length,
    paused: audiences.filter((a) => a.status === "paused").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Públicos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie segmentações por gênero, idade e interesses — ative, pause e registre mudanças.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-lg font-semibold text-foreground">{stats.total}</span>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-health-green" />
          <span className="text-sm text-muted-foreground">Ativos:</span>
          <span className="text-sm font-semibold text-foreground">{stats.active}</span>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span className="text-sm text-muted-foreground">Pausados:</span>
          <span className="text-sm font-semibold text-foreground">{stats.paused}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, interesse ou cliente…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-1">
          {(["all", "active", "paused"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === s ? "bg-cobalt text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? "Todos" : s === "active" ? "Ativos" : "Pausados"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-muted-foreground">
            <Filter className="w-5 h-5 mx-auto mb-2 opacity-50" />
            Nenhum público corresponde aos filtros.
          </div>
        ) : (
          filtered.map((a) => {
            const isExpanded = expandedId === a.id;
            const showHist = showHistoryId === a.id;
            const history = audienceTimelines[a.id] ?? [];
            return (
              <motion.div
                key={a.id}
                id={`audience-${a.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("glass-card overflow-hidden", focusId === a.id && "ring-1 ring-cobalt")}
              >
                <div
                  className="p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">{a.name}</h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 border rounded-full font-medium px-2.5 py-0.5 text-xs",
                            a.status === "active"
                              ? "text-health-green bg-health-green/10 border-health-green/20"
                              : "text-muted-foreground bg-secondary border-border",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              a.status === "active" ? "bg-health-green" : "bg-muted-foreground",
                            )}
                          />
                          {a.status === "active" ? "Ativo" : "Pausado"}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {clientName(a.clientId)}
                        </span>
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1.5">{a.description}</p>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Gênero: </span>
                          <span className="text-foreground font-medium">{genderLabel[a.gender]}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faixa etária: </span>
                          <span className="text-foreground font-medium">{a.ageMin}–{a.ageMax} anos</span>
                        </div>
                        {a.size !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Tamanho: </span>
                            <span className="text-foreground font-medium">
                              {a.size >= 1_000_000 ? `${(a.size / 1_000_000).toFixed(1)}M` : `${(a.size / 1000).toFixed(0)}k`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {a.interests.map((i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-cobalt/10 text-cobalt border border-cobalt/20">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHistoryId(showHist ? null : a.id)}
                        className={cn(showHist && "bg-secondary text-cobalt")}
                      >
                        <History className="w-3.5 h-3.5 mr-1.5" />
                        Histórico
                      </Button>
                      <AddChangeDialog
                        targetType="audience"
                        targetId={a.id}
                        targetName={a.name}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Mudança
                          </Button>
                        }
                      />
                      <Button
                        variant={a.status === "active" ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleAudience(a.id)}
                      >
                        <Power className="w-3.5 h-3.5 mr-1.5" />
                        {a.status === "active" ? "Pausar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showHist && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5">
                        {history.length > 0 ? (
                          <TimelineView entries={history} />
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhuma mudança registrada para este público.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
