import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
