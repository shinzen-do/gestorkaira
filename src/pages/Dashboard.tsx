import { motion } from "framer-motion";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ClientTree } from "@/components/ClientTree";
import { dailyMetrics } from "@/data/mockData";
import { useAppData } from "@/contexts/AppDataContext";
import { DollarSign, TrendingUp, Target, ShoppingCart, Plug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const today = dailyMetrics[dailyMetrics.length - 1];
const avg7 = {
  cpa: dailyMetrics.reduce((a, b) => a + b.cpa, 0) / dailyMetrics.length,
  roas: dailyMetrics.reduce((a, b) => a + b.roas, 0) / dailyMetrics.length,
  spend: dailyMetrics.reduce((a, b) => a + b.spend, 0) / dailyMetrics.length,
  conversions: dailyMetrics.reduce((a, b) => a + b.conversions, 0) / dailyMetrics.length,
};

export default function Dashboard() {
  const { clients } = useAppData();
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Central de Comando</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do desempenho em tempo real</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Dados simulados · Meta Ads não conectado</span>
        </div>
      </motion.div>

      {/* Meta Ads Integration Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-cobalt/30 bg-gradient-to-r from-cobalt/5 to-transparent"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-cobalt/20 flex items-center justify-center shrink-0">
            <Plug className="w-5 h-5 text-cobalt" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conectar ao Meta Ads</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              Sincronize CPA, ROAS, gasto e conversões diretamente das suas contas do Meta Business em tempo real.
              A integração será habilitada em breve — por enquanto, os dados são simulados.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Integração Meta Ads em desenvolvimento", { description: "Vamos avisá-lo quando estiver disponível." })}
          className="shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Em breve
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="CPA Hoje" value={today.cpa.toFixed(2)} prefix="R$" change={-((today.cpa - avg7.cpa) / avg7.cpa) * 100} icon={<Target className="w-4 h-4" />} />
        <MetricCard label="ROAS Hoje" value={`${today.roas.toFixed(1)}x`} change={((today.roas - avg7.roas) / avg7.roas) * 100} icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Investido Hoje" value={today.spend.toLocaleString()} prefix="R$" change={((today.spend - avg7.spend) / avg7.spend) * 100} icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Conversões Hoje" value={today.conversions.toString()} change={((today.conversions - avg7.conversions) / avg7.conversions) * 100} icon={<ShoppingCart className="w-4 h-4" />} />
      </div>

      <PerformanceChart />

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Clientes</h2>
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientTree key={client.id} client={client} />
          ))}
        </div>
      </div>
    </div>
  );
}
