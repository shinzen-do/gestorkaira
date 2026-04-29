import { cn } from "@/lib/utils";
import type { Status } from "@/contexts/AppDataContext";

const cfg: Record<Status, { label: string; className: string }> = {
  active: { label: "Ativo", className: "text-health-green bg-health-green/10 border-health-green/20" },
  paused: { label: "Pausado", className: "text-health-yellow bg-health-yellow/10 border-health-yellow/20" },
  archived: { label: "Arquivado", className: "text-muted-foreground bg-secondary border-border" },
};

export function StatusBadge({ status }: { status: Status }) {
  const c = cfg[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 border rounded-full px-2 py-0.5 text-[10px] font-medium", c.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full",
        status === "active" ? "bg-health-green" : status === "paused" ? "bg-health-yellow" : "bg-muted-foreground")} />
      {c.label}
    </span>
  );
}
