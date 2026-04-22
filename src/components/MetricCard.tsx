import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  prefix?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, prefix, icon }: MetricCardProps) {
  const trend = change === undefined ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-foreground tracking-tight">
          {prefix}{value}
        </span>
        {change !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium pb-0.5",
            trend === "up" ? "text-health-green" : trend === "down" ? "text-health-red" : "text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
