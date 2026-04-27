import { Creative } from "@/data/mockData";
import { Image as ImageIcon, Video, Layers as LayersIcon, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const formatIcon = {
  image: ImageIcon,
  video: Video,
  carousel: LayersIcon,
} as const;

const formatLabel = {
  image: "Estático",
  video: "Vídeo",
  carousel: "Carrossel",
} as const;

interface CreativesPanelProps {
  creatives: Creative[];
}

export function CreativesPanel({ creatives }: CreativesPanelProps) {
  if (!creatives || creatives.length === 0) {
    return (
      <div className="ml-6 mt-2 p-4 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        Nenhum criativo cadastrado neste conjunto.
      </div>
    );
  }
  return (
    <div className="ml-6 mt-2 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">Criativos</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {creatives.map((cr) => {
          const Icon = formatIcon[cr.format];
          return (
            <div key={cr.id} className="glass-card p-3 flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-border",
                cr.status === "active" ? "bg-cobalt/10 text-cobalt" : "bg-secondary text-muted-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{cr.name}</p>
                  {cr.status === "paused" ? (
                    <Pause className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Play className="w-3 h-3 text-health-green" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatLabel[cr.format]}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                  {cr.ctr !== undefined && (
                    <span className="text-muted-foreground">CTR <span className="text-foreground font-medium">{cr.ctr.toFixed(1)}%</span></span>
                  )}
                  {cr.impressions !== undefined && (
                    <span className="text-muted-foreground">Impr. <span className="text-foreground font-medium">{(cr.impressions / 1000).toFixed(0)}k</span></span>
                  )}
                </div>
                {cr.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{cr.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
