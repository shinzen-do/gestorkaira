import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, History, Plus, BarChart3, Film, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthBadge } from "./HealthBadge";
import { TimelineView } from "./TimelineView";
import { AddChangeDialog } from "./AddChangeDialog";
import { CreativesPanel } from "./CreativesPanel";
import { useAppData } from "@/contexts/AppDataContext";
import type { Client, Campaign, AdSet } from "@/data/mockData";

function AdSetRow({ adSet, campaignName, clientName }: { adSet: AdSet; campaignName: string; clientName: string }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCreatives, setShowCreatives] = useState(false);
  const { audiences } = useAppData();
  const linkedAudiences = audiences.filter((a) => adSet.audienceIds?.includes(a.id));

  return (
    <div className="ml-12 border-l border-border pl-4 py-1">
      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">{adSet.name}</span>
          <HealthBadge status={adSet.health} />
          {adSet.status === "paused" && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Pausado</span>
          )}
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">CPA</p>
            <p className="text-sm font-medium text-foreground">R${adSet.cpa.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-medium text-foreground">{adSet.roas.toFixed(1)}x</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreatives((v) => !v)}
              title="Criativos"
              className={cn("p-1.5 rounded-md hover:bg-secondary transition-colors", showCreatives && "bg-secondary text-cobalt")}
            >
              <Film className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTimeline((v) => !v)}
              title="Histórico"
              className={cn("p-1.5 rounded-md hover:bg-secondary transition-colors", showTimeline && "bg-secondary text-cobalt")}
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <AddChangeDialog
              targetType="adset"
              targetId={adSet.id}
              targetName={`${clientName} › ${campaignName} › ${adSet.name}`}
              trigger={
                <button title="Registrar mudança" className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>
        </div>
      </div>

      {linkedAudiences.length > 0 && (
        <div className="ml-6 mt-1 flex items-center gap-1.5 flex-wrap">
          <Target className="w-3 h-3 text-muted-foreground" />
          {linkedAudiences.map((a) => (
            <span key={a.id} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {a.name}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreatives && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CreativesPanel creatives={adSet.creatives ?? []} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-6 mt-2">
            {adSet.timeline.length > 0 ? (
              <TimelineView entries={adSet.timeline} />
            ) : (
              <p className="text-xs text-muted-foreground py-2">Nenhuma mudança registrada ainda.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignRow({ campaign, clientName }: { campaign: Campaign; clientName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="ml-6 border-l border-border pl-4 py-1">
      <div
        className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-90")} />
          <span className="text-sm font-medium text-foreground truncate">{campaign.name}</span>
          <HealthBadge status={campaign.health} />
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">{campaign.objective}</span>
        </div>
        <div className="flex items-center gap-6 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">CPA</p>
            <p className="text-sm font-medium text-foreground">R${campaign.cpa.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-medium text-foreground">{campaign.roas.toFixed(1)}x</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Gasto</p>
            <p className="text-sm font-medium text-foreground">R${campaign.spend.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTimeline((v) => !v)}
              title="Histórico"
              className={cn("p-1.5 rounded-md hover:bg-secondary transition-colors", showTimeline && "bg-secondary text-cobalt")}
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <AddChangeDialog
              targetType="campaign"
              targetId={campaign.id}
              targetName={`${clientName} › ${campaign.name}`}
              trigger={
                <button title="Registrar mudança" className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              }
            />
            <button title="Métricas" className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTimeline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-6 mt-2">
            {campaign.timeline.length > 0 ? (
              <TimelineView entries={campaign.timeline} />
            ) : (
              <p className="text-xs text-muted-foreground py-2">Nenhuma mudança registrada ainda.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {campaign.adSets.map((as) => (
              <AdSetRow key={as.id} adSet={as} campaignName={campaign.name} clientName={clientName} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClientTree({ client, defaultExpanded = false }: { client: Client; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-foreground">{client.name}</h3>
              <HealthBadge status={client.health} size="lg" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.industry} · {client.campaigns.length} campanha{client.campaigns.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">CPA Médio</p>
            <p className="text-sm font-semibold text-foreground">R${client.avgCpa.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">ROAS Médio</p>
            <p className="text-sm font-semibold text-foreground">{client.avgRoas.toFixed(1)}x</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Investido</p>
            <p className="text-sm font-semibold text-foreground">R${client.totalSpend.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border pb-4">
            {client.campaigns.map((c) => (
              <CampaignRow key={c.id} campaign={c} clientName={client.name} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
