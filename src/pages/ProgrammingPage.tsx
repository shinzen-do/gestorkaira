import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { ClientProgrammingSection, plannedTotal } from "@/components/ClientProgrammingSection";
import { PlannedCampaignDialog } from "@/components/dialogs/PlannedCampaignDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export default function ProgrammingPage() {
  useDocumentTitle("Programação");
  const { clients, plannedCampaigns } = useAppData();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(t));
  }, [clients, query]);

  const totals = useMemo(() => {
    const totalBudget = clients.reduce((s, c) => s + (Number(c.monthly_budget) || 0), 0);
    const totalPlanned = plannedCampaigns
      .filter((p) => p.status !== "cancelled")
      .reduce((s, p) => s + plannedTotal(p), 0);
    return { totalBudget, totalPlanned, count: plannedCampaigns.filter((p) => p.status !== "cancelled").length };
  }, [clients, plannedCampaigns]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-cobalt uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Programação
          </div>
          <h1 className="font-display text-3xl text-foreground mt-1">Programação do mês</h1>
          <p className="text-sm text-muted-foreground mt-1">Planeje campanhas futuras por cliente e veja o total comparado ao orçamento mensal.</p>
        </div>
        <PlannedCampaignDialog trigger={<Button><Plus className="w-4 h-4 mr-1.5" /> Nova programação</Button>} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="glass-card border-cobalt/30"><CardContent className="pt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total planejado</p>
          <p className="text-2xl font-display text-cobalt mt-1">{fmtBRL(totals.totalPlanned)}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Soma orçamentos mensais</p>
          <p className="text-2xl font-display text-foreground mt-1">{fmtBRL(totals.totalBudget)}</p>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Campanhas programadas</p>
          <p className="text-2xl font-display text-foreground mt-1">{totals.count}</p>
        </CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={Sparkles} title="Nenhum cliente cadastrado" description="Crie um cliente para começar a programar campanhas." />
      ) : (
        <div className="space-y-5">
          {filtered.map((c) => (
            <Card key={c.id} className="glass-card">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{c.name}</h3>
                    {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                  </div>
                </div>
                <ClientProgrammingSection clientId={c.id} monthlyBudget={Number(c.monthly_budget) || 0} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
