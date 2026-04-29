import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, hint, icon }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gold">{icon}</span>}
      </div>
      <p className="text-2xl font-display font-medium text-foreground tracking-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}
