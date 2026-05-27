import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Target as TargetIcon, Pencil, Trash2, Pause, Play, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData, type Audience } from "@/contexts/AppDataContext";
import { AudienceDialog } from "@/components/dialogs/AudienceDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/PageSkeletons";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";

function AudienceCard({ a }: { a: Audience }) {
  const { audienceCampaigns, campaigns, clients, deleteAudience, toggleAudience } = useAppData();
  const links = audienceCampaigns.filter((ac) => ac.audience_id === a.id);
  const linkedCamps = campaigns.filter((c) => links.some((l) => l.campaign_id === c.id));

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <TargetIcon className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
            <StatusBadge status={a.status} />
          </div>
          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
            <span>{a.gender === "all" ? "Todos" : a.gender === "female" ? "Feminino" : "Masculino"}</span>
            <span>{a.age_min}–{a.age_max} anos</span>
            {a.size_estimate != null && <span>{a.size_estimate.toLocaleString("pt-BR")} pessoas</span>}
          </div>
          {a.interests.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {a.interests.map((i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{i}</span>)}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Link2 className="w-3 h-3" /> Ativo em {linkedCamps.length} campanha{linkedCamps.length !== 1 && "s"}
            </p>
            {linkedCamps.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Não vinculado. Edite para ativar em campanhas.</p>
            ) : (
              <div className="space-y-0.5">
                {linkedCamps.map((c) => {
                  const cl = clients.find((x) => x.id === c.client_id);
                  return (
                    <p key={c.id} className="text-[11px] text-foreground">
                      <span className="text-muted-foreground">{cl?.name} ›</span> {c.name}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button title={a.status === "active" ? "Pausar" : "Ativar"}
            onClick={() => toggleAudience(a.id).then(() => toast.success("Atualizado"))}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
            {a.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <AudienceDialog audience={a} trigger={
            <button title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          } />
          <ConfirmDialog title="Excluir público?" description={`"${a.name}" e seus vínculos serão removidos.`}
            confirmLabel="Excluir" destructive
            onConfirm={() => deleteAudience(a.id).then(() => toast.success("Público excluído"))}
            trigger={<button title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function AudiencesPage() {
  useDocumentTitle("Públicos");
  const { audiences, loading } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return audiences.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!t) return true;
      return a.name.toLowerCase().includes(t)
        || (a.description ?? "").toLowerCase().includes(t)
        || a.interests.some((i) => i.toLowerCase().includes(t));
    });
  }, [audiences, query, filter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground">Públicos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie públicos e ative-os em campanhas. Os mesmos públicos aparecem dentro de cada cliente.
          </p>
        </div>
        <AudienceDialog trigger={<Button><Plus className="w-4 h-4 mr-1.5" /> Novo público</Button>} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome, descrição ou interesse..." className="pl-9" />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Todos <span className="ml-1 text-[10px] text-muted-foreground">{audiences.length}</span></TabsTrigger>
            <TabsTrigger value="active">Ativos <span className="ml-1 text-[10px] text-muted-foreground">{audiences.filter(a=>a.status==="active").length}</span></TabsTrigger>
            <TabsTrigger value="paused">Pausados <span className="ml-1 text-[10px] text-muted-foreground">{audiences.filter(a=>a.status==="paused").length}</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && audiences.length === 0 ? (
        <CardGridSkeleton count={4} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading && filtered.length === 0 && (
          query || filter !== "all" ? (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground col-span-full">Nenhum público encontrado.</div>
          ) : (
            <div className="col-span-full">
              <EmptyState icon={TargetIcon} title="Nenhum público ainda"
                description="Crie um público com gênero, faixa etária e interesses, e ative em uma ou mais campanhas."
                action={<AudienceDialog trigger={<Button><Plus className="w-4 h-4 mr-1.5" /> Criar primeiro público</Button>} />}
              />
            </div>
          )
        )}
        {filtered.map((a) => <AudienceCard key={a.id} a={a} />)}
      </div>
      )}
    </div>
  );
}
