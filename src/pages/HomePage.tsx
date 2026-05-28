import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Target, Calendar as CalendarIcon, History, Plus, ArrowRight, Sparkles } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { AudienceDialog } from "@/components/dialogs/AudienceDialog";
import { MetricCard } from "@/components/shared/MetricCard";
import { PacingAlertsBanner } from "@/components/PacingAlertsBanner";
import { BillingPendingBanner } from "@/components/BillingPendingBanner";
import { TutorialModal } from "@/components/TutorialModal";
import { HomePageSkeleton } from "@/components/shared/PageSkeletons";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isBefore, startOfDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HomePage() {
  useDocumentTitle("Dashboard");
  const { clients, campaigns, audiences, calendarNotes, timelineEntries, loading } = useAppData();
  const { user } = useAuth();

  if (loading && clients.length === 0 && campaigns.length === 0) {
    return <HomePageSkeleton />;
  }

  const today = startOfDay(new Date());
  const in7 = addDays(today, 8);
  const overdue = calendarNotes.filter((n) => !n.done && isBefore(parseISO(n.date), today));
  const upcoming = calendarNotes.filter((n) => {
    if (n.done) return false;
    const d = parseISO(n.date);
    return !isBefore(d, today) && isBefore(d, in7);
  });

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const activeAudiences = audiences.filter((a) => a.status === "active").length;
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend ?? 0), 0);
  const recent = timelineEntries.slice(0, 5);

  const greeting = user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : "";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <TutorialModal />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.2em] text-gold mb-2">Kaira</p>
        <h1 className="font-display text-4xl text-foreground tracking-tight">Bem-vindo{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-2">Tráfego pago · Resultados reais</p>
      </motion.div>

      <BillingPendingBanner />
      <PacingAlertsBanner />

      {clients.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative glass-card border-gold-soft p-6 overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 20% 0%, hsl(var(--gold) / 0.10), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-gold" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gold mb-1">Comece por aqui</p>
              <p className="font-display text-xl text-foreground tracking-tight">
                Cadastre seu primeiro cliente
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                A partir dele você organiza campanhas, conjuntos, criativos e públicos. Leva 30 segundos.
              </p>
            </div>
            <ClientDialog trigger={
              <Button className="shrink-0"><Plus className="w-4 h-4 mr-1.5" /> Novo cliente</Button>
            } />
          </div>
        </motion.div>
      )}

      {/* Quick metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Clientes" value={String(clients.length)} icon={<Users className="w-4 h-4" />} hint={`${clients.filter((c) => c.status === "active").length} ativos`} />
        <MetricCard label="Campanhas ativas" value={String(activeCampaigns)} icon={<Sparkles className="w-4 h-4" />} hint={`${campaigns.length} no total`} />
        <MetricCard label="Públicos ativos" value={String(activeAudiences)} icon={<Target className="w-4 h-4" />} hint={`${audiences.length} no total`} />
        <MetricCard label="Investido" value={`R$ ${totalSpend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} icon={<History className="w-4 h-4" />} hint="Soma das campanhas" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ClientDialog trigger={
          <button className="glass-card p-5 text-left hover:border-gold-soft transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-gold" />
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
            </div>
            <p className="text-sm font-medium text-foreground">Novo cliente</p>
            <p className="text-xs text-muted-foreground mt-1">Cadastre um cliente e comece a gerenciar campanhas.</p>
          </button>
        } />
        <AudienceDialog trigger={
          <button className="glass-card p-5 text-left hover:border-gold-soft transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-gold" />
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
            </div>
            <p className="text-sm font-medium text-foreground">Novo público</p>
            <p className="text-xs text-muted-foreground mt-1">Crie um público e ative em uma ou mais campanhas.</p>
          </button>
        } />
        <Link to="/calendar" className="glass-card p-5 text-left hover:border-gold-soft transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <CalendarIcon className="w-5 h-5 text-gold" />
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
          </div>
          <p className="text-sm font-medium text-foreground">Calendário</p>
          <p className="text-xs text-muted-foreground mt-1">{overdue.length > 0 ? `${overdue.length} ${overdue.length === 1 ? "atrasada" : "atrasadas"} — ` : ""}{upcoming.length} {upcoming.length === 1 ? "próxima" : "próximas"}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas tarefas */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gold" /> Próximas tarefas
            </h2>
            <Link to="/calendar" className="text-xs text-cobalt hover:underline">Ver tudo</Link>
          </div>
          {[...overdue, ...upcoming].length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Nada pendente.</p>
          ) : (
            <div className="space-y-2">
              {[...overdue, ...upcoming].slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/40">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.priority === "high" ? "bg-destructive" : n.priority === "medium" ? "bg-gold" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground">{format(parseISO(n.date), "dd 'de' MMM", { locale: ptBR })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Histórico recente */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-gold" /> Mudanças recentes
            </h2>
            <Link to="/timeline" className="text-xs text-cobalt hover:underline">Ver tudo</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Nenhuma mudança registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/40">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${e.impact === "positive" ? "bg-health-green" : e.impact === "negative" ? "bg-destructive" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{e.description}</p>
                    <p className="text-[11px] text-muted-foreground">{format(parseISO(e.occurred_at), "dd 'de' MMM HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
