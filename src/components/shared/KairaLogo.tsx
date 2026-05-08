import logo from "@/assets/kaira-logo.png";
import { cn } from "@/lib/utils";

export function KairaLogo({ size = 32, withText = false, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img src={logo} alt="Kaira" width={size} height={size} className="object-contain drop-shadow-[0_0_6px_hsl(var(--gold)/0.35)]" />
      {withText && (
        <span className="font-display text-xl tracking-[0.2em] text-foreground">KAIRA</span>
      )}
    </div>
  );
}
