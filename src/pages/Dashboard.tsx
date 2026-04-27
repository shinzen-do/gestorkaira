import { motion } from "framer-motion";
import { MetricCard } from "@/components/MetricCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { ClientTree } from "@/components/ClientTree";
import { dailyMetrics } from "@/data/mockData";
import { useAppData } from "@/contexts/AppDataContext";
import { DollarSign, TrendingUp, Target, ShoppingCart } from "lucide-react";

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Central de Comando</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do desempenho em tempo real</p>
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
