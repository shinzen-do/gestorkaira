import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kaira_cookies_consent";

type Consent = "all" | "essential" | null;

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "all" || v === "essential") return v;
  } catch {}
  return null;
}

function writeConsent(v: Exclude<Consent, null>) {
  try {
    localStorage.setItem(STORAGE_KEY, v);
    localStorage.setItem(`${STORAGE_KEY}_at`, new Date().toISOString());
  } catch {}
}

export function getCookieConsent(): Consent {
  return readConsent();
}

export function CookiesBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readConsent() === null) {
      const t = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const accept = (kind: Exclude<Consent, null>) => {
    writeConsent(kind);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <div className="relative glass-panel border border-glass-border rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse 50% 60% at 0% 0%, hsl(var(--gold) / 0.08), transparent 70%)",
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 text-gold" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Cookies e privacidade</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Usamos cookies essenciais pra você ficar logado e cookies opcionais pra medir conversão (Meta Pixel, UTM). Você pode aceitar tudo, só os essenciais, ou ver detalhes na{" "}
                  <Link to="/privacidade" className="underline text-foreground hover:text-gold transition-colors">
                    Política de Privacidade
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" onClick={() => accept("all")} className="gap-2">
                    Aceitar tudo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => accept("essential")}>
                    Só essenciais
                  </Button>
                </div>
              </div>
              <button
                onClick={() => accept("essential")}
                className="absolute top-3 right-3 sm:static p-1 text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
