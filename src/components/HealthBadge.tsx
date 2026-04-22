import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/data/mockData";

const config: Record<HealthStatus, { label: string; className: string; dotClass: string }> = {
  green: { label: "Saudável", className: "text-health-green bg-health-green/10 border-health-green/20", dotClass: "bg-health-green" },
  yellow: { label: "Atenção", className: "text-health-yellow bg-health-yellow/10 border-health-yellow/20", dotClass: "bg-health-yellow" },
  red: { label: "Crítico", className: "text-health-red bg-health-red/10 border-health-red/20", dotClass: "bg-health-red" },
};

export function HealthBadge({ status, size = "sm" }: { status: HealthStatus; size?: "sm" | "lg" }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 border rounded-full font-medium", c.className, size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dotClass, status === "red" && "animate-pulse-glow")} />
      {c.label}
    </span>
  );
}
