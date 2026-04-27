import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  GitBranch,
  BarChart3,
  Layers,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
  Target,
  Users,
  Star,
  ChevronDown,
  Workflow,
  LineChart,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: easing },
  }),
};

const features = [
  {
    icon: Layers,
    title: "Gestão Hierárquica",
    description:
      "Visualize clientes, campanhas e conjuntos de anúncios em uma árvore interativa com status de saúde em tempo real.",
  },
  {
    icon: GitBranch,
    title: "Timeline de Mudanças",
    description:
      "Registre e audite cada alteração — criativos, orçamento, público — com impacto direto no desempenho.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description:
      "CPA, ROAS e tendências comparadas automaticamente com a média dos últimos 7 dias.",
  },
  {
    icon: Target,
    title: "Foco no que Importa",
    description:
      "Alertas inteligentes destacam campanhas que precisam de atenção antes que virem prejuízo.",
  },
  {
    icon: Shield,
    title: "Auditoria Completa",
    description:
      "Histórico imutável de cada decisão. Justifique resultados para clientes com clareza absoluta.",
  },
  {
    icon: Workflow,
    title: "Fluxo Otimizado",
    description:
      "Construído por gestores, para gestores. Cada clique foi pensado para reduzir fricção.",
  },
];

const stats = [
  { value: "3.4x", label: "ROAS médio dos usuários" },
  { value: "67%", label: "Menos tempo em planilhas" },
  { value: "12h", label: "Economizadas por semana" },
  { value: "99.9%", label: "Uptime garantido" },
];

const steps = [
  {
    number: "01",
    title: "Cadastre seus clientes",
    description:
      "Importe ou crie a estrutura hierárquica completa: cliente → campanha → conjunto de anúncios.",
  },
  {
    number: "02",
    title: "Acompanhe em tempo real",
    description:
      "Métricas atualizadas, status de saúde visual e tendências comparativas instantâneas.",
  },
  {
    number: "03",
    title: "Decida com precisão",
    description:
      "Histórico completo de mudanças e impacto. Pare de adivinhar — escale o que funciona.",
  },
];

const testimonials = [
  {
    name: "Rafael Mendes",
    role: "Head de Tráfego, Agência Vortex",
    content:
      "Substituí 4 ferramentas por uma só. Meu time recuperou 2 dias por semana e nossos clientes notaram a diferença na primeira reunião.",
    rating: 5,
  },
  {
    name: "Camila Duarte",
    role: "Gestora de Performance Freelancer",
    content:
      "A timeline de mudanças mudou minha vida. Quando uma campanha despenca, eu sei exatamente o que mexi — e quando.",
    rating: 5,
  },
  {
    name: "Lucas Ferreira",
    role: "CEO, Growth Lab",
    content:
      "Finalmente uma ferramenta com a sofisticação que o nível do nosso trabalho exige. Vale cada centavo.",
    rating: 5,
  },
];

const comparisons = [
  { feature: "Visão hierárquica de clientes", kaira: true, others: false },
  { feature: "Timeline auditável de mudanças", kaira: true, others: false },
  { feature: "Comparativo automático 7 dias", kaira: true, others: false },
  { feature: "Dashboard com alertas inteligentes", kaira: true, others: "parcial" },
  { feature: "Interface pensada para gestor de elite", kaira: true, others: false },
  { feature: "Setup em minutos", kaira: true, others: false },
];

const faqs = [
  {
    q: "Para quem o Kaira foi feito?",
    a: "Para gestores de tráfego, agências e profissionais de performance que gerenciam múltiplos clientes e campanhas e cansaram de planilhas, Trello e ferramentas genéricas.",
  },
  {
    q: "Preciso conectar minhas contas de anúncio?",
    a: "Você pode usar o Kaira para organizar e auditar suas operações imediatamente. Integrações com plataformas de mídia estão no roadmap.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Usamos criptografia de nível bancário, isolamento por linha (RLS) e infraestrutura redundante. Seus dados são exclusivamente seus.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem letras miúdas. Você fica porque entrega valor — não porque está preso.",
  },
  {
    q: "Tem teste grátis?",
    a: "Sim. Crie sua conta agora e explore todas as funcionalidades sem cartão de crédito.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-glass-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cobalt/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cobalt" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Kaira</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#how" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Clientes</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="glow-cobalt">
              <Link to="/signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-cobalt/5 blur-[140px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-glass-border bg-card/40 backdrop-blur-sm text-sm text-muted-foreground mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-cobalt" />
            Para Gestores de Tráfego de Elite
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Pare de gerenciar campanhas{" "}
            <span className="text-gradient-cobalt">no improviso.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A central de comando que transforma caos em clareza. Gerencie clientes,
            campanhas e performance com a precisão que separa amadores de profissionais
            de alto nível.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button size="lg" asChild className="glow-cobalt text-base px-8 h-12">
              <Link to="/signup">
                Começar Grátis Agora
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 h-12">
              <a href="#how">Ver como funciona</a>
            </Button>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cobalt" /> Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cobalt" /> Setup em 2 minutos
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cobalt" /> Cancele quando quiser
            </span>
          </motion.div>

          {/* Hero Visual Mock */}
          <motion.div
            custom={5}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-20 relative"
          >
            <div className="absolute -inset-4 bg-cobalt/10 blur-3xl rounded-full" />
            <div className="glass-card p-2 relative">
              <div className="bg-surface-1 rounded-lg p-6 border border-glass-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {stats.map((s) => (
                    <div key={s.label} className="text-left">
                      <div className="text-2xl md:text-3xl font-bold text-gradient-cobalt">
                        {s.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 text-left">
                  {[
                    { label: "Acme Corp", health: "green", roas: "4.2x" },
                    { label: "Vortex Co", health: "yellow", roas: "2.1x" },
                    { label: "Nova Brand", health: "green", roas: "5.8x" },
                  ].map((c) => (
                    <div key={c.label} className="bg-surface-2 rounded-md p-3 border border-glass-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{c.label}</span>
                        <span className={`w-2 h-2 rounded-full ${c.health === "green" ? "bg-health-green" : "bg-health-yellow"}`} />
                      </div>
                      <div className="text-sm text-cobalt font-semibold">ROAS {c.roas}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Você gerencia milhões em mídia.{" "}
              <span className="text-muted-foreground">Em planilhas?</span>
            </h2>
            <ul className="space-y-4">
              {[
                "Trello bagunçado, planilhas que ninguém atualiza",
                "Cliente perguntando o que mudou — e você sem saber",
                "Campanhas despencando sem alerta antecipado",
                "Decisões tomadas no achismo, não no dado",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easing }}
            className="glass-card p-8"
          >
            <div className="text-cobalt text-sm font-medium mb-4">Com Kaira</div>
            <ul className="space-y-4">
              {[
                "Tudo em um único painel hierárquico e intuitivo",
                "Histórico auditável de cada mudança e seu impacto",
                "Alertas inteligentes antes que vire prejuízo",
                "Decisões baseadas em comparativos automáticos",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cobalt mt-0.5 flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Tudo que você precisa.{" "}
              <span className="text-muted-foreground">Nada que não precisa.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada recurso foi projetado para responder uma pergunta real do seu dia.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card p-8 group hover:border-cobalt/30 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-lg bg-cobalt/10 flex items-center justify-center mb-5 group-hover:bg-cobalt/20 transition-colors">
                  <f.icon className="w-5 h-5 text-cobalt" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Comece em <span className="text-gradient-cobalt">3 passos.</span>
            </h2>
            <p className="text-muted-foreground">Da primeira hora ao primeiro resultado.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative glass-card p-8"
              >
                <div className="text-5xl font-bold text-gradient-cobalt mb-4 opacity-60">
                  {s.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Gestores de elite{" "}
              <span className="text-muted-foreground">já escolheram.</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.9/5 · 200+ profissionais</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card p-8 flex flex-col"
              >
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6 flex-1">"{t.content}"</p>
                <div className="border-t border-glass-border pt-4">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Por que <span className="text-gradient-cobalt">Kaira</span>?
            </h2>
            <p className="text-muted-foreground">Compare e veja a diferença.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-glass-border bg-surface-2/50">
              <div className="text-sm font-medium text-muted-foreground">Recurso</div>
              <div className="text-sm font-semibold text-cobalt text-center">Kaira</div>
              <div className="text-sm text-muted-foreground text-center">Outros</div>
            </div>
            {comparisons.map((c) => (
              <div
                key={c.feature}
                className="grid grid-cols-3 gap-4 p-6 border-b border-glass-border last:border-0 items-center"
              >
                <div className="text-sm">{c.feature}</div>
                <div className="flex justify-center">
                  <Check className="w-5 h-5 text-cobalt" />
                </div>
                <div className="flex justify-center">
                  {c.others === true ? (
                    <Check className="w-5 h-5 text-muted-foreground" />
                  ) : c.others === "parcial" ? (
                    <span className="text-xs text-muted-foreground">parcial</span>
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Perguntas <span className="text-muted-foreground">frequentes.</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card border-0 px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cobalt/10 blur-[140px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <Sparkles className="w-8 h-8 text-cobalt mx-auto mb-6" />
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
            Sua próxima campanha vencedora{" "}
            <span className="text-gradient-cobalt">começa aqui.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Junte-se aos gestores que pararam de improvisar e começaram a operar
            como elite.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button size="lg" asChild className="glow-cobalt text-base px-10 h-12">
              <Link to="/signup">
                Começar Grátis Agora
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 h-12">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Criptografia bancária
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Setup em 2 min
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Sem fidelidade
            </span>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cobalt" />
            <span className="font-semibold text-foreground">Kaira</span>
            <span>· Central de comando para gestores de elite</span>
          </div>
          <span>© {new Date().getFullYear()} Kaira. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
