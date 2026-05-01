import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Calendar as CalendarIcon, Wallet, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

interface MonthlyBudget {
  id: string;
  user_id: string;
  client_id: string;
  year: number;
  month: number;
  total_budget: number;
}

interface DailySpend {
  id: string;
  monthly_budget_id: string;
  day: number;
  spent_so_far: number;
  recorded_at: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function pacingColor(diff: number) {
  // diff = % gasto - % do mês passado. -3 a +3 = verde, < -3 = amarelo, > 3 = laranja
  if (diff < -3) return { bg: "bg-yellow-500/15", text: "text-yellow-500", ring: "ring-yellow-500/40", label: "Abaixo do ritmo" };
  if (diff > 3) return { bg: "bg-orange-500/15", text: "text-orange-500", ring: "ring-orange-500/40", label: "Acima do ritmo" };
  return { bg: "bg-emerald-500/15", text: "text-emerald-500", ring: "ring-emerald-500/40", label: "No ritmo certo" };
}

export default function PacingPage() {
  const { user } = useAuth();
  const { clients } = useAppData();
  const { toast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [spends, setSpends] = useState<DailySpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form state per client/budget
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({}); // client_id -> string
  const [spentInputs, setSpentInputs] = useState<Record<string, string>>({}); // budget_id -> string
  const [dayInputs, setDayInputs] = useState<Record<string, string>>({}); // budget_id -> string

  const totalDays = daysInMonth(year, month);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const [b, s] = await Promise.all([
      supabase.from("monthly_budgets").select("*").eq("year", year).eq("month", month),
      supabase.from("daily_spends").select("*"),
    ]);
    setBudgets((b.data ?? []) as MonthlyBudget[]);
    setSpends((s.data ?? []) as DailySpend[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, year, month]);

  // Garante que existe um registro de monthly_budget para cada cliente do mês selecionado
  useEffect(() => {
    if (!user || clients.length === 0 || loading) return;
    const missing = clients.filter((c) => !budgets.some((b) => b.client_id === c.id));
    if (missing.length === 0) return;
    (async () => {
      const rows = missing.map((c) => ({
        user_id: user.id,
        client_id: c.id,
        year,
        month,
        total_budget: 0,
      }));
      const { data, error } = await supabase.from("monthly_budgets").insert(rows).select();
      if (!error && data) setBudgets((p) => [...p, ...(data as MonthlyBudget[])]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, budgets, loading, user, year, month]);

  const saveBudget = async (clientId: string) => {
    const b = budgets.find((x) => x.client_id === clientId);
    if (!b || !user) return;
    const value = parseFloat(budgetInputs[clientId] ?? String(b.total_budget));
    if (isNaN(value) || value < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingId(b.id);
    const { error } = await supabase.from("monthly_budgets").update({ total_budget: value }).eq("id", b.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setBudgets((p) => p.map((x) => (x.id === b.id ? { ...x, total_budget: value } : x)));
    setBudgetInputs((p) => ({ ...p, [clientId]: "" }));
    toast({ title: "Orçamento atualizado" });
  };

  const saveSpend = async (budgetId: string) => {
    if (!user) return;
    const day = parseInt(dayInputs[budgetId] ?? String(today.getDate()));
    const spent = parseFloat(spentInputs[budgetId] ?? "");
    if (isNaN(day) || day < 1 || day > totalDays) {
      toast({ title: "Dia inválido", description: `Use um número entre 1 e ${totalDays}.`, variant: "destructive" });
      return;
    }
    if (isNaN(spent) || spent < 0) {
      toast({ title: "Valor gasto inválido", variant: "destructive" });
      return;
    }
    setSavingId(budgetId);
    // Upsert por (monthly_budget_id, day)
    const existing = spends.find((s) => s.monthly_budget_id === budgetId && s.day === day);
    let res;
    if (existing) {
      res = await supabase.from("daily_spends")
        .update({ spent_so_far: spent, recorded_at: new Date().toISOString() })
        .eq("id", existing.id).select().single();
    } else {
      res = await supabase.from("daily_spends").insert({
        user_id: user.id,
        monthly_budget_id: budgetId,
        day,
        spent_so_far: spent,
      }).select().single();
    }
    setSavingId(null);
    if (res.error) {
      toast({ title: "Erro", description: res.error.message, variant: "destructive" });
      return;
    }
    const row = res.data as DailySpend;
    setSpends((p) => {
      const filtered = p.filter((x) => !(x.monthly_budget_id === budgetId && x.day === day));
      return [...filtered, row];
    });
    setSpentInputs((p) => ({ ...p, [budgetId]: "" }));
    setDayInputs((p) => ({ ...p, [budgetId]: "" }));
    toast({ title: "Gasto registrado" });
  };

  const yearOptions = useMemo(() => {
    const y = today.getFullYear();
    return [y - 1, y, y + 1];
  }, [today]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" /> Pacing
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Controle de orçamento mensal</h1>
        <p className="text-muted-foreground text-sm">
          Defina o orçamento de cada cliente, registre o gasto do dia e veja em tempo real se o ritmo está saudável.
        </p>
      </motion.div>

      {/* Filtros mês/ano */}
      <Card className="glass-card">
        <CardContent className="pt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[160px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mês</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[120px]">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ano</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            <CalendarIcon className="w-3.5 h-3.5 inline mr-1" />
            Mês com {totalDays} dias
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Crie um cliente em "Clientes" para começar a controlar o orçamento.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => {
            const budget = budgets.find((b) => b.client_id === client.id);
            if (!budget) return null;
            // Histórico ordenado por dia (maior dia do mês primeiro);
            // em caso de empate no dia, o registro mais recente (recorded_at) vence.
            const clientSpends = spends
              .filter((s) => s.monthly_budget_id === budget.id)
              .sort((a, b) => {
                if (b.day !== a.day) return b.day - a.day;
                return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
              });
            const latest = clientSpends[0];
            const avgPerDay = budget.total_budget > 0 ? budget.total_budget / totalDays : 0;
            const pctSpent = budget.total_budget > 0 && latest ? (latest.spent_so_far / budget.total_budget) * 100 : 0;
            const pctMonth = latest ? (latest.day / totalDays) * 100 : 0;
            const diff = pctSpent - pctMonth;
            const color = pacingColor(diff);

            // Projeção: assume que o ritmo médio diário até agora se mantém pelo resto do mês
            const daysElapsed = latest ? latest.day : 0;
            const daysRemaining = Math.max(0, totalDays - daysElapsed);
            const dailyPaceSoFar = latest && daysElapsed > 0 ? latest.spent_so_far / daysElapsed : 0;
            const projectedTotal = latest ? latest.spent_so_far + dailyPaceSoFar * daysRemaining : 0;
            const projectionDelta = budget.total_budget > 0 ? projectedTotal - budget.total_budget : 0;
            const projectionPct = budget.total_budget > 0 ? (projectedTotal / budget.total_budget) * 100 : 0;

            return (
              <Card key={client.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      {client.industry && (
                        <p className="text-xs text-muted-foreground mt-0.5">{client.industry}</p>
                      )}
                    </div>
                    {budget.total_budget > 0 && latest && (
                      <div className={`px-4 py-2 rounded-xl ring-1 ${color.bg} ${color.ring}`}>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pacing</div>
                        <div className={`text-2xl font-bold ${color.text}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                        </div>
                        <div className={`text-[11px] ${color.text}`}>{color.label}</div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Orçamento mensal */}
                  <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end p-4 rounded-xl bg-surface-2/40 border border-glass-border">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Orçamento do mês
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder={budget.total_budget > 0 ? fmtBRL(budget.total_budget) : "Ex: 5000"}
                        value={budgetInputs[client.id] ?? ""}
                        onChange={(e) => setBudgetInputs((p) => ({ ...p, [client.id]: e.target.value }))}
                        className="bg-background"
                      />
                    </div>
                    <Button onClick={() => saveBudget(client.id)} disabled={savingId === budget.id}>
                      {savingId === budget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4 mr-2" /> Salvar</>)}
                    </Button>
                  </div>

                  {/* Métricas */}
                  {budget.total_budget > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Orçamento total" value={fmtBRL(budget.total_budget)} />
                        <Stat label="Média ideal/dia" value={fmtBRL(avgPerDay)} />
                        <Stat
                          label="Gasto até agora"
                          value={latest ? fmtBRL(latest.spent_so_far) : "—"}
                          sub={latest ? `Dia ${latest.day} de ${totalDays}` : "Sem registros"}
                        />
                        <Stat
                          label="% gasto vs % mês"
                          value={latest ? `${pctSpent.toFixed(1)}% / ${pctMonth.toFixed(1)}%` : "—"}
                        />
                      </div>

                      {latest && daysElapsed > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Stat
                            label="Ritmo atual/dia"
                            value={fmtBRL(dailyPaceSoFar)}
                            sub={`${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`}
                          />
                          <div className={`p-3 rounded-lg border ${color.ring} ${color.bg}`}>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Projeção fim do mês
                            </div>
                            <div className={`text-lg font-semibold mt-1 ${color.text}`}>{fmtBRL(projectedTotal)}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {projectionPct.toFixed(1)}% do orçamento
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg border ${color.ring} ${color.bg}`}>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Diferença projetada
                            </div>
                            <div className={`text-lg font-semibold mt-1 ${color.text}`}>
                              {projectionDelta > 0 ? "+" : ""}{fmtBRL(projectionDelta)}
                            </div>
                            <div className={`text-[11px] mt-0.5 ${color.text}`}>
                              {projectionDelta > 0 ? "Vai estourar o orçamento" : projectionDelta < 0 ? "Vai sobrar orçamento" : "No alvo"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Atualização diária */}
                  <div className="grid md:grid-cols-[120px_1fr_auto] gap-3 items-end p-4 rounded-xl bg-surface-2/40 border border-glass-border">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dia do mês</Label>
                      <Input
                        type="number"
                        min={1}
                        max={totalDays}
                        placeholder={String(today.getDate())}
                        value={dayInputs[budget.id] ?? ""}
                        onChange={(e) => setDayInputs((p) => ({ ...p, [budget.id]: e.target.value }))}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Total gasto no mês até esse dia</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Ex: 1850.50"
                        value={spentInputs[budget.id] ?? ""}
                        onChange={(e) => setSpentInputs((p) => ({ ...p, [budget.id]: e.target.value }))}
                        className="bg-background"
                      />
                    </div>
                    <Button onClick={() => saveSpend(budget.id)} disabled={savingId === budget.id} variant="secondary">
                      {savingId === budget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
                    </Button>
                  </div>

                  {clientSpends.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Histórico: {clientSpends.slice(0, 6).map((s) => `Dia ${s.day}: ${fmtBRL(s.spent_so_far)}`).join(" · ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-lg bg-background border border-glass-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
