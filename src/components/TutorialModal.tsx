import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Users,
  Layers,
  Target,
  Activity,
  Calendar as CalendarIcon,
  Wand2,
  TrendingUp,
  History,
  ArrowRight,
  Check,
} from "lucide-react";

type StepKind =
  | "welcome"
  | "clients"
  | "hierarchy"
  | "audiences"
  | "pacing"
  | "programming"
  | "tasks"
  | "history";

interface Step {
  kind: StepKind;
  badge: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    kind: "welcome",
    badge: "Bem-vindo",
    title: "Sua central de comando",
    body:
      "Tudo que um gestor de tráfego precisa em um lugar só: clientes, campanhas, pacing, públicos e tarefas com IA. Vou te mostrar em 1 min.",
  },
  {
    kind: "clients",
    badge: "1. Clientes",
    title: "Comece cadastrando quem você gerencia",
    body:
      "Cada cliente tem orçamento mensal — esse número alimenta o Pacing e a Programação automaticamente.",
  },
  {
    kind: "hierarchy",
    badge: "2. Hierarquia",
    title: "Campanhas, conjuntos e criativos",
    body:
      "Dentro de cada cliente você monta a árvore: Campanha (CBO ou ABO) → Conjunto → Criativo. Mesma lógica do Meta Ads.",
  },
  {
    kind: "audiences",
    badge: "3. Públicos",
    title: "Salva um público, reusa em várias campanhas",
    body:
      "Cadastre gênero, idade e interesses. Depois é só ativar nas campanhas que precisar.",
  },
  {
    kind: "pacing",
    badge: "4. Pacing",
    title: "Saiba se o cliente vai estourar antes do fim do mês",
    body:
      "Registre o gasto acumulado por dia. Kaira projeta o total e te avisa em verde / amarelo / vermelho.",
  },
  {
    kind: "programming",
    badge: "5. Programação",
    title: "Planeje campanhas futuras",
    body:
      "Defina início, fim e orçamento. Aparece na timeline e em Tarefas quando chegar a hora de ativar.",
  },
  {
    kind: "tasks",
    badge: "6. Tarefas + IA",
    title: "Cole mensagens, IA gera as tarefas",
    body:
      "Cole briefing do cliente ou conversa de WhatsApp — a IA extrai prazos e prioridades em tarefas acionáveis.",
  },
  {
    kind: "history",
    badge: "7. Pronto pra começar",
    title: "Atalhos pra ir mais rápido",
    body:
      "Aperta ? a qualquer momento pra ver atalhos. g c vai pra Clientes, n c cria novo cliente, ⌘K busca tudo.",
  },
];

function Illustration({ kind }: { kind: StepKind }) {
  switch (kind) {
    case "welcome":
      return (
        <div className="relative h-44 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,hsl(var(--gold)/0.18),transparent_70%)]" />
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/5 border border-gold/40 flex items-center justify-center shadow-[inset_0_1px_0_0_hsl(var(--gold)/0.3)]"
          >
            <Sparkles className="w-10 h-10 text-gold" strokeWidth={1.2} />
          </motion.div>
        </div>
      );
    case "clients":
      return (
        <div className="space-y-2">
          {[
            { name: "Acme Cosméticos", industry: "E-commerce", budget: "R$ 8.000", color: "bg-health-green" },
            { name: "Studio Pilates Vida", industry: "Saúde", budget: "R$ 3.500", color: "bg-gold" },
          ].map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-glass-border bg-surface-1/60"
            >
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.industry}</p>
              </div>
              <span className="text-xs font-mono text-gold">{c.budget}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
            </motion.div>
          ))}
        </div>
      );
    case "hierarchy":
      return (
        <div className="space-y-1.5">
          {[
            { icon: Users, label: "Acme Cosméticos", depth: 0, color: "text-gold" },
            { icon: Sparkles, label: "Campanha BF — Conversão", depth: 1, color: "text-cobalt" },
            { icon: Layers, label: "Conjunto · Mulheres 25-45", depth: 2, color: "text-muted-foreground" },
            { icon: Target, label: "Criativo · Vídeo depoimento", depth: 3, color: "text-muted-foreground" },
          ].map((row, i) => {
            const Icon = row.icon;
            return (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-2 text-xs"
                style={{ paddingLeft: `${row.depth * 18}px` }}
              >
                {row.depth > 0 && (
                  <span className="text-muted-foreground/40 font-mono">└</span>
                )}
                <Icon className={`w-3.5 h-3.5 ${row.color} shrink-0`} />
                <span className="text-foreground truncate">{row.label}</span>
              </motion.div>
            );
          })}
        </div>
      );
    case "audiences":
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 rounded-lg border border-glass-border bg-surface-1/60 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-foreground">Mães 28–42 · skincare premium</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["skincare", "anti-idade", "maternidade", "luxo", "+3"].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-cobalt/10 text-cobalt border border-cobalt/30"
              >
                {tag}
              </motion.span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Ativo em 3 campanhas</p>
        </motion.div>
      );
    case "pacing":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Acme · Maio</span>
            <span className="text-emerald-400 font-mono">+2.1% no ritmo</span>
          </div>
          <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "62%" }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/70 to-emerald-400"
            />
            <div className="absolute inset-y-0 left-[60%] w-px bg-foreground/60" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded bg-surface-1/60 border border-glass-border">
              <p className="text-muted-foreground">Gasto</p>
              <p className="text-foreground font-mono">R$ 4.960</p>
            </div>
            <div className="p-2 rounded bg-surface-1/60 border border-glass-border">
              <p className="text-muted-foreground">Projeção</p>
              <p className="text-foreground font-mono">R$ 7.850</p>
            </div>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-emerald-400">Sobra</p>
              <p className="text-emerald-400 font-mono">R$ 150</p>
            </div>
          </div>
        </div>
      );
    case "programming":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
              <span key={i} className="text-center">{d}</span>
            ))}
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Black Friday · CBO", start: 0, span: 5, color: "from-cobalt to-cobalt-glow" },
              { label: "Aquecimento BF", start: 2, span: 3, color: "from-gold to-gold-glow" },
              { label: "Pós-venda upsell", start: 4, span: 2, color: "from-emerald-500 to-emerald-400" },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.15 + i * 0.1, ease: "easeOut" }}
                style={{ transformOrigin: "left", marginLeft: `${(c.start / 7) * 100}%`, width: `${(c.span / 7) * 100}%` }}
                className={`h-6 rounded bg-gradient-to-r ${c.color} flex items-center px-2`}
              >
                <span className="text-[10px] font-medium text-background truncate">{c.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "tasks":
      return (
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg border border-cobalt/30 bg-cobalt/5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cobalt" />
              <span className="text-[10px] uppercase tracking-wider text-cobalt">Você colou</span>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              "Acme quer pausar BF segunda e subir 3 criativos até quarta. Orçamento sobe pra R$ 200/dia em dezembro."
            </p>
          </motion.div>
          <div className="text-[10px] uppercase tracking-wider text-gold flex items-center gap-1 pt-1">
            <Sparkles className="w-3 h-3" /> IA gerou
          </div>
          {[
            "Pausar campanha BF segunda 02/12",
            "Subir 3 criativos novos até 04/12",
            "Aumentar orçamento Acme → R$ 200/dia em dezembro",
          ].map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2 text-xs p-2 rounded border border-border bg-secondary/30"
            >
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-foreground">{t}</span>
            </motion.div>
          ))}
        </div>
      );
    case "history":
      return (
        <div className="grid grid-cols-3 gap-2">
          {[
            { kbd: "?", label: "Atalhos", icon: Sparkles },
            { kbd: "⌘K", label: "Busca", icon: TrendingUp },
            { kbd: "g c", label: "Clientes", icon: Users },
            { kbd: "g p", label: "Pacing", icon: Activity },
            { kbd: "n c", label: "Novo cliente", icon: Users },
            { kbd: "g t", label: "Timeline", icon: History },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.kbd}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-glass-border bg-surface-1/60"
              >
                <Icon className="w-4 h-4 text-gold" />
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">
                  {s.kbd}
                </kbd>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      );
  }
}

export function TutorialModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("tutorial_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data?.tutorial_completed) setOpen(true);
    })();
  }, [user]);

  const finish = async () => {
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, tutorial_completed: true }, { onConflict: "user_id" });
    }
    setOpen(false);
  };

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-glass-border">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--gold) / 0.10), transparent 70%)",
            }}
          />

          <div className="relative px-8 pt-8 pb-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold">{s.badge}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{step + 1}/{STEPS.length}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={s.kind}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="min-h-[180px]">
                  <Illustration kind={s.kind} />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl text-foreground tracking-tight">{s.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative px-8 pb-6 pt-2 space-y-4">
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1 rounded-full transition-all ${
                    i === step ? "w-8 bg-gold" : i < step ? "w-4 bg-gold/40" : "w-4 bg-border"
                  }`}
                  aria-label={`Ir pro passo ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={finish} className="text-xs text-muted-foreground">
                Pular tutorial
              </Button>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                    Voltar
                  </Button>
                )}
                {!isLast ? (
                  <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1.5">
                    Próximo <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={finish} className="gap-1.5">
                    Começar <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
