import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] px-1.5 h-6 rounded-md bg-secondary border border-border text-[11px] font-mono text-foreground shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
      {children}
    </kbd>
  );
}

function Combo({ combo }: { combo: string }) {
  const parts = combo.split(" ");
  return (
    <div className="flex gap-1 items-center">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-[10px] text-muted-foreground">depois</span>}
          <Kbd>{p}</Kbd>
        </span>
      ))}
    </div>
  );
}

export function ShortcutsModal({ open, onOpenChange }: Props) {
  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-card border-glass-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gold" /> Atalhos de teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-2">{g}</p>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <div
                    key={s.combo}
                    className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-md hover:bg-secondary/40"
                  >
                    <span className="text-sm text-foreground">{s.label}</span>
                    <Combo combo={s.combo} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-border pt-3 mt-2">
          Dica: pressione <Kbd>?</Kbd> a qualquer momento pra abrir essa lista.
        </p>
      </DialogContent>
    </Dialog>
  );
}
