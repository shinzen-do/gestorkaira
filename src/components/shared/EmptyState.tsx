import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative glass-card overflow-hidden p-12 text-center flex flex-col items-center gap-4"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(var(--gold) / 0.10), transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" aria-hidden />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shadow-[inset_0_1px_0_0_hsl(var(--gold)/0.25)]">
          <Icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
        </div>
      </div>

      <div className="relative space-y-1.5">
        <p className="font-display text-xl text-foreground tracking-tight">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="relative mt-2">{action}</div>}
    </motion.div>
  );
}
