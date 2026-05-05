import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Users, ChevronRight, Pencil, Trash2, Megaphone, Layers, Film,
  Target as TargetIcon, History, Award, ExternalLink, Pause, Play, BarChart3, TrendingUp, DollarSign, CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppData, type Client, type Campaign, type AdSet, type Creative, type ValidatedCreative } from "@/contexts/AppDataContext";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { CampaignDialog } from "@/components/dialogs/CampaignDialog";
import { AdSetDialog } from "@/components/dialogs/AdSetDialog";
import { CreativeDialog } from "@/components/dialogs/CreativeDialog";
import { ValidatedCreativeDialog } from "@/components/dialogs/ValidatedCreativeDialog";
import { ChangeDialog } from "@/components/dialogs/ChangeDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// ---------- Creative row ----------
function CreativeRow({ c, adSetId }: { c: Creative; adSetId: string }) {
  const { deleteCreative, updateCreative } = useAppData();
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground truncate">{c.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-1.5 py-0.5 rounded">{c.format}</span>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
        {c.results > 0 && <span>{c.results.toLocaleString()} {c.result_label}</span>}
        {c.cost_per_result > 0 && <span>R$ {c.cost_per_result.toFixed(2)} / result.</span>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" title="Abrir link"
            className="p-1.5 rounded hover:bg-secondary text-cobalt"><ExternalLink className="w-3.5 h-3.5" /></a>
        )}
        <button title={c.status === "active" ? "Pausar" : "Ativar"} onClick={() => updateCreative(c.id, { status: c.status === "active" ? "paused" : "active" }).then(() => toast.success(c.status === "active" ? "Pausado" : "Ativado"))}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
          {c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <CreativeDialog adSetId={adSetId} creative={c} trigger={
          <button title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
        } />
        <ConfirmDialog
          title="Excluir criativo?"
          description={`"${c.name}" será removido permanentemente.`}
          confirmLabel="Excluir" destructive
          onConfirm={() => deleteCreative(c.id).then(() => toast.success("Criativo excluído"))}
          trigger={<button title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
        />
      </div>
    </div>
  );
}

// ---------- AdSet block ----------
function AdSetBlock({ adSet, campaign, client }: { adSet: AdSet; campaign: Campaign; client: Client }) {
  const { creatives, deleteAdSet, updateAdSet, audiences, audienceCampaigns, timelineEntries } = useAppData();
  const [open, setOpen] = useState(false);
  const setCreatives = creatives.filter((c) => c.ad_set_id === adSet.id);
  const linkedAudiences = audiences.filter((a) =>
    audienceCampaigns.some((ac) => ac.audience_id === a.id && ac.campaign_id === campaign.id),
  );
  const setTimeline = timelineEntries.filter((t) => t.target_type === "adset" && t.target_id === adSet.id);

  return (
    <div className="ml-6 border-l border-border pl-3 my-1.5">
      <div className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-secondary/40 transition-colors">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0", open && "rotate-90")} />
          <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">{adSet.name}</span>
          <StatusBadge status={adSet.status} />
          <span className="text-[11px] text-muted-foreground">R$ {Number(adSet.budget).toLocaleString()}</span>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <CreativeDialog adSetId={adSet.id} trigger={
            <button title="Adicionar criativo" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Plus className="w-3.5 h-3.5" /></button>
          } />
          <ChangeDialog targetType="adset" targetId={adSet.id} targetName={`${client.name} › ${campaign.name} › ${adSet.name}`} trigger={
            <button title="Registrar mudança" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><History className="w-3.5 h-3.5" /></button>
          } />
          <button title={adSet.status === "active" ? "Pausar" : "Ativar"}
            onClick={() => updateAdSet(adSet.id, { status: adSet.status === "active" ? "paused" : "active" }).then(() => toast.success("Atualizado"))}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
            {adSet.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <AdSetDialog campaignId={campaign.id} adSet={adSet} trigger={
            <button title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          } />
          <ConfirmDialog title="Excluir conjunto?" description={`"${adSet.name}" e todos seus criativos serão removidos.`}
            confirmLabel="Excluir" destructive
            onConfirm={() => deleteAdSet(adSet.id).then(() => toast.success("Conjunto excluído"))}
            trigger={<button title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ml-5 my-2 space-y-1.5">
              {linkedAudiences.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  <TargetIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Públicos da campanha:</span>
                  {linkedAudiences.map((a) => (
                    <span key={a.id} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{a.name}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Criativos</p>
                <CreativeDialog adSetId={adSet.id} trigger={
                  <button className="text-[11px] text-cobalt hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                } />
              </div>
              {setCreatives.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2 px-2">Nenhum criativo ainda.</p>
              ) : (
                setCreatives.map((c) => <CreativeRow key={c.id} c={c} adSetId={adSet.id} />)
              )}

              {setTimeline.length > 0 && (
                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Histórico</p>
                  <div className="space-y-1">
                    {setTimeline.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                          t.impact === "positive" ? "bg-health-green" : t.impact === "negative" ? "bg-destructive" : "bg-muted-foreground")} />
                        <span className="text-foreground">{t.description}</span>
                        <span>· {format(parseISO(t.occurred_at), "dd/MM", { locale: ptBR })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Campaign block ----------
function CampaignBlock({ campaign, client }: { campaign: Campaign; client: Client }) {
  const { adSets, deleteCampaign, updateCampaign, timelineEntries } = useAppData();
  const [open, setOpen] = useState(false);
  const sets = adSets.filter((a) => a.campaign_id === campaign.id);
  const campTimeline = timelineEntries.filter((t) => t.target_type === "campaign" && t.target_id === campaign.id);

  return (
    <div className="border border-border rounded-lg bg-card/40">
      <div className="flex items-center justify-between gap-3 p-3">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", open && "rotate-90")} />
          <Megaphone className="w-4 h-4 text-gold shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">{campaign.name}</span>
              <StatusBadge status={campaign.status} />
              {campaign.objective && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{campaign.objective}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Orç. R$ {Number(campaign.budget).toLocaleString()} · Gasto R$ {Number(campaign.spend).toLocaleString()} · ROAS {Number(campaign.roas).toFixed(1)}x · {sets.length} conjunto{sets.length !== 1 && "s"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <AdSetDialog campaignId={campaign.id} trigger={
            <button title="Novo conjunto" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Plus className="w-3.5 h-3.5" /></button>
          } />
          <ChangeDialog targetType="campaign" targetId={campaign.id} targetName={`${client.name} › ${campaign.name}`} trigger={
            <button title="Registrar mudança" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><History className="w-3.5 h-3.5" /></button>
          } />
          <button title={campaign.status === "active" ? "Pausar" : "Ativar"}
            onClick={() => updateCampaign(campaign.id, { status: campaign.status === "active" ? "paused" : "active" }).then(() => toast.success("Atualizado"))}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
            {campaign.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <CampaignDialog clientId={client.id} campaign={campaign} trigger={
            <button title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          } />
          <ConfirmDialog title="Excluir campanha?" description="Conjuntos e criativos vinculados também serão excluídos."
            confirmLabel="Excluir" destructive
            onConfirm={() => deleteCampaign(campaign.id).then(() => toast.success("Campanha excluída"))}
            trigger={<button title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
            <div className="p-3">
              {sets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-2">Nenhum conjunto de anúncios.</p>
                  <AdSetDialog campaignId={campaign.id} trigger={<Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />Criar conjunto</Button>} />
                </div>
              ) : (
                sets.map((as) => <AdSetBlock key={as.id} adSet={as} campaign={campaign} client={client} />)
              )}

              {campTimeline.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Histórico da campanha</p>
                  <div className="space-y-1.5">
                    {campTimeline.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-[11px]">
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                          t.impact === "positive" ? "bg-health-green" : t.impact === "negative" ? "bg-destructive" : "bg-muted-foreground")} />
                        <span className="text-foreground">{t.description}</span>
                        <span className="text-muted-foreground">· {format(parseISO(t.occurred_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Validated creative card ----------
function ValidatedCreativeCard({ vc }: { vc: ValidatedCreative }) {
  const { deleteValidatedCreative } = useAppData();
  return (
    <div className="border border-border rounded-lg p-3 bg-card/40 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Award className="w-3.5 h-3.5 text-gold" />
          <span className="text-sm font-medium text-foreground">{vc.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{vc.format}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
          {vc.ctr != null && <span>CTR {vc.ctr}%</span>}
          {vc.roas != null && <span>ROAS {vc.roas}x</span>}
          <span>Validado em {format(parseISO(vc.validated_at), "dd/MM/yy", { locale: ptBR })}</span>
        </div>
        {vc.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5">
            {vc.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">{t}</span>)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {vc.url && <a href={vc.url} target="_blank" rel="noopener noreferrer" title="Abrir" className="p-1.5 rounded hover:bg-secondary text-cobalt"><ExternalLink className="w-3.5 h-3.5" /></a>}
        <ConfirmDialog title="Excluir criativo validado?" confirmLabel="Excluir" destructive
          onConfirm={() => deleteValidatedCreative(vc.id).then(() => toast.success("Excluído"))}
          trigger={<button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
        />
      </div>
    </div>
  );
}

// ---------- Client card ----------
function ClientCard({ client, defaultOpen }: { client: Client; defaultOpen: boolean }) {
  const { campaigns, audiences, audienceCampaigns, validatedCreatives, deleteClient, timelineEntries } = useAppData();
  const [open, setOpen] = useState(defaultOpen);
  const clientCampaigns = campaigns.filter((c) => c.client_id === client.id);
  const clientCampaignIds = new Set(clientCampaigns.map((c) => c.id));
  const clientAudiences = audiences.filter((a) =>
    audienceCampaigns.some((ac) => ac.audience_id === a.id && clientCampaignIds.has(ac.campaign_id)),
  );
  const clientValCreatives = validatedCreatives.filter((v) => v.client_id === client.id);

  // Mini-dashboard
  const totalSpend = clientCampaigns.reduce((s, c) => s + Number(c.spend ?? 0), 0);
  const totalBudget = clientCampaigns.reduce((s, c) => s + Number(c.budget ?? 0), 0);
  const avgRoas = clientCampaigns.length > 0
    ? clientCampaigns.reduce((s, c) => s + Number(c.roas ?? 0), 0) / clientCampaigns.length
    : 0;
  const activeCampaigns = clientCampaigns.filter((c) => c.status === "active").length;
  const clientTimeline = timelineEntries.filter((t) =>
    (t.target_type === "client" && t.target_id === client.id) ||
    (t.target_type === "campaign" && clientCampaignIds.has(t.target_id))
  ).slice(0, 3);

  return (
    <motion.div id={`client-${client.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform shrink-0", open && "rotate-90")} />
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center text-primary-foreground font-display text-lg shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground truncate">{client.name}</h3>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.industry || "—"} · {clientCampaigns.length} campanha{clientCampaigns.length !== 1 && "s"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <ChangeDialog targetType="client" targetId={client.id} targetName={client.name} trigger={
            <button title="Registrar mudança" className="p-2 rounded hover:bg-secondary text-muted-foreground"><History className="w-4 h-4" /></button>
          } />
          <ClientDialog client={client} trigger={
            <button title="Editar cliente" className="p-2 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-4 h-4" /></button>
          } />
          <ConfirmDialog title={`Excluir ${client.name}?`} description="Todas as campanhas, conjuntos, criativos e públicos vinculados serão removidos."
            confirmLabel="Excluir" destructive
            onConfirm={() => deleteClient(client.id).then(() => toast.success("Cliente excluído"))}
            trigger={<button title="Excluir" className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
            {/* Mini-dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-secondary/20">
              <div className="space-y-0.5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Megaphone className="w-3 h-3" /> Camp. ativas</p><p className="text-lg font-display text-foreground">{activeCampaigns}</p></div>
              <div className="space-y-0.5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Investido</p><p className="text-lg font-display text-foreground">R$ {totalSpend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p></div>
              <div className="space-y-0.5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Orç. mensal</p><p className="text-lg font-display text-foreground">R$ {Number(client.monthly_budget).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p></div>
              <div className="space-y-0.5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ROAS médio</p><p className="text-lg font-display text-foreground">{avgRoas.toFixed(1)}x</p></div>
            </div>

            <Tabs defaultValue="campaigns" className="px-4 py-3">
              <TabsList className="bg-secondary/40">
                <TabsTrigger value="campaigns" className="text-xs gap-1.5"><Megaphone className="w-3.5 h-3.5" /> Campanhas <span className="text-[10px] text-muted-foreground ml-1">{clientCampaigns.length}</span></TabsTrigger>
                <TabsTrigger value="programming" className="text-xs gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> Programação</TabsTrigger>
                <TabsTrigger value="audiences" className="text-xs gap-1.5"><TargetIcon className="w-3.5 h-3.5" /> Públicos ativos <span className="text-[10px] text-muted-foreground ml-1">{clientAudiences.length}</span></TabsTrigger>
                <TabsTrigger value="creatives" className="text-xs gap-1.5"><Award className="w-3.5 h-3.5" /> Validados <span className="text-[10px] text-muted-foreground ml-1">{clientValCreatives.length}</span></TabsTrigger>
                <TabsTrigger value="history" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" /> Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="mt-3 space-y-2">
                <div className="flex justify-end">
                  <CampaignDialog clientId={client.id} trigger={<Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Nova campanha</Button>} />
                </div>
                {clientCampaigns.length === 0 ? (
                  <EmptyState icon={Megaphone} title="Nenhuma campanha ainda" description="Crie a primeira campanha deste cliente." />
                ) : (
                  clientCampaigns.map((c) => <CampaignBlock key={c.id} campaign={c} client={client} />)
                )}
              </TabsContent>

              <TabsContent value="programming" className="mt-3">
                <ClientProgrammingSection clientId={client.id} monthlyBudget={Number(client.monthly_budget) || 0} />
              </TabsContent>
                <p className="text-[11px] text-muted-foreground">Públicos que estão vinculados a campanhas deste cliente. Crie ou vincule novos públicos na aba <strong>Públicos</strong>.</p>
                {clientAudiences.length === 0 ? (
                  <EmptyState icon={TargetIcon} title="Nenhum público vinculado" description="Vá em Públicos e ative um público nas campanhas deste cliente." />
                ) : (
                  <div className="space-y-1.5">
                    {clientAudiences.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{a.name}</span>
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {a.gender === "all" ? "Todos" : a.gender === "female" ? "Feminino" : "Masculino"} · {a.age_min}–{a.age_max}
                            {a.interests.length > 0 && ` · ${a.interests.slice(0, 3).join(", ")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="creatives" className="mt-3 space-y-2">
                <div className="flex justify-end">
                  <ValidatedCreativeDialog clientId={client.id} trigger={<Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Adicionar validado</Button>} />
                </div>
                {clientValCreatives.length === 0 ? (
                  <EmptyState icon={Award} title="Nenhum criativo validado" description="Salve aqui os criativos aprovados que se provaram em produção." />
                ) : (
                  <div className="space-y-2">{clientValCreatives.map((v) => <ValidatedCreativeCard key={v.id} vc={v} />)}</div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-3 space-y-2">
                {clientTimeline.length === 0 ? (
                  <EmptyState icon={History} title="Sem histórico" description="As mudanças registradas em campanhas deste cliente aparecem aqui." />
                ) : (
                  <div className="space-y-1.5">
                    {clientTimeline.map((t) => (
                      <div key={t.id} className="flex items-start gap-2 p-2.5 rounded bg-secondary/40">
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                          t.impact === "positive" ? "bg-health-green" : t.impact === "negative" ? "bg-destructive" : "bg-muted-foreground")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{t.description}</p>
                          {t.details && <p className="text-[11px] text-muted-foreground mt-0.5">{t.details}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{format(parseISO(t.occurred_at), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Page ----------
export default function ClientsPage() {
  const { clients, loading } = useAppData();
  const [params] = useSearchParams();
  const focusId = params.get("focus");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(t) || (c.industry ?? "").toLowerCase().includes(t),
    );
  }, [clients, query]);

  useEffect(() => {
    if (focusId) {
      const t = setTimeout(() => {
        document.getElementById(`client-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [focusId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Cada cliente tem seu dashboard, campanhas, públicos vinculados e criativos validados.</p>
        </div>
        <ClientDialog trigger={<Button><Plus className="w-4 h-4 mr-1.5" /> Novo cliente</Button>} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {loading && <div className="text-center text-sm text-muted-foreground py-8">Carregando...</div>}
        {!loading && filtered.length === 0 && (
          query ? (
            <div className="glass-card p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            <EmptyState icon={Users} title="Nenhum cliente ainda"
              description="Crie seu primeiro cliente para começar a organizar campanhas, públicos e criativos."
              action={<ClientDialog trigger={<Button><Plus className="w-4 h-4 mr-1.5" /> Criar primeiro cliente</Button>} />}
            />
          )
        )}
        {filtered.map((c) => (
          <ClientCard key={c.id} client={c} defaultOpen={c.id === focusId} />
        ))}
      </div>
    </div>
  );
}
