import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoWebp from "@/assets/kaira-logo.webp";
import logoWebp2x from "@/assets/kaira-logo-2x.webp";
import logoPng from "@/assets/kaira-logo-96.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 — rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, hsl(var(--gold) / 0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, hsl(var(--cobalt) / 0.08), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <Link to="/" className="inline-flex items-center mb-12 group" aria-label="Kaira">
          <picture>
            <source srcSet={`${logoWebp} 1x, ${logoWebp2x} 2x`} type="image/webp" />
            <img
              src={logoPng}
              alt=""
              width={40}
              height={40}
              className="object-contain drop-shadow-[0_0_8px_hsl(var(--gold)/0.4)]"
              loading="eager"
              decoding="async"
            />
          </picture>
          <span className="font-display text-2xl tracking-[0.2em] text-foreground -ml-0.5">
            AIRA
          </span>
        </Link>

        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 blur-3xl bg-gold/20 rounded-full" aria-hidden />
          <motion.h1
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative font-display text-[7rem] sm:text-[9rem] leading-none tracking-tight text-gradient-gold"
          >
            404
          </motion.h1>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-3 flex items-center justify-center gap-2">
          <Compass className="w-3.5 h-3.5" /> Página fora do mapa
        </p>
        <h2 className="font-display text-3xl text-foreground mb-3 tracking-tight">
          Esse caminho não existe
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-2">
          O endereço{" "}
          <code className="px-1.5 py-0.5 rounded bg-secondary/60 text-[11px] font-mono text-foreground">
            {location.pathname}
          </code>{" "}
          não foi encontrado.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-10">
          Pode ter sido movido, ou nunca existiu.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Home className="w-4 h-4" /> Ir pro dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
