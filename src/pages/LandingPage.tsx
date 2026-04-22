import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, GitBranch, BarChart3, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Layers,
    title: "Gestão Hierárquica",
    description: "Visualize clientes, campanhas e conjuntos de anúncios em uma árvore interativa com status de saúde em tempo real.",
  },
  {
    icon: GitBranch,
    title: "Timeline de Mudanças",
    description: "Registre e audite cada alteração — criativos, orçamento, público — com impacto direto no desempenho.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description: "CPA, ROAS e tendências comparadas automaticamente com a média dos últimos 7 dias.",
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="glow-cobalt">
              <Link to="/signup">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cobalt/5 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-glass-border bg-card/40 backdrop-blur-sm text-sm text-muted-foreground mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-cobalt" />
            Para Gestores de Tráfego de Elite
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            A Central de Comando{" "}
            <span className="text-gradient-cobalt">Definitiva</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Supere planilhas e Trello. Gerencie clientes, campanhas e performance
            com a precisão e elegância que seu trabalho exige.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-4"
          >
            <Button size="lg" asChild className="glow-cobalt text-base px-8">
              <Link to="/signup">
                Começar Agora
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/login">Entrar</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
          >
            Tudo que você precisa.{" "}
            <span className="text-muted-foreground">Nada que não precisa.</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card p-8 group hover:border-cobalt/20 transition-colors duration-500"
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

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cobalt" />
            <span>Kaira</span>
          </div>
          <span>© {new Date().getFullYear()} Kaira. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
