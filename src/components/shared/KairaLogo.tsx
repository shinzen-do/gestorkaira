import logoWebp from "@/assets/kaira-logo.webp"
import logoWebp2x from "@/assets/kaira-logo-2x.webp"
import logoPng from "@/assets/kaira-logo-96.png"
import { cn } from "@/lib/utils"

export function KairaLogo({ size = 32, withText = false, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <picture>
        <source srcSet={`${logoWebp} 1x, ${logoWebp2x} 2x`} type="image/webp" />
        <img
          src={logoPng}
          alt="Kaira"
          width={size}
          height={size}
          className="object-contain drop-shadow-[0_0_6px_hsl(var(--gold)/0.35)]"
          loading="eager"
          decoding="async"
        />
      </picture>
      {withText && (
        <span className="font-display text-xl tracking-[0.2em] text-foreground">KAIRA</span>
      )}
    </div>
  )
}
