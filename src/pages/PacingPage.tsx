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

const parseAmount = (value: string) => {
  const raw = value.trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const normalized = lastComma > lastDot
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/,/g, "");
  return normalized ? Number(normalized) : NaN;
};

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

  const [now, setNow] = useState(() => new Date());
  const today = now;
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Atualiza o "agora" a cada minuto para que o dia atual fique sempre correto sem reload
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Detecta virada de dia/mês/ano e ajusta filtros automaticamente quando o usuário
  // está visualizando o mês corrente
  useEffect(() => {
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    setYear((y) => (y === curYear || y === curYear - 1 ? curYear : y));
    setMonth((m) => {
      // Se o usuário estava no mês "atual" anterior, avança junto
      const prevDate = new Date(year, month - 1, 1);
      const isViewingCurrent =
        prevDate.getFullYear() === curYear && prevDate.getMonth() + 1 === curMonth;
      return isViewingCurrent ? curMonth : m;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [spends, setSpends] = useState<DailySpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form state per client/budget
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({}); // client_id -> string
  const [spentInputs, setSpentInputs] = useState<Record<string, string>>({}); // budget_id -> string
  const [dayInputs, setDayInputs] = useState<Record<string, string>>({}); // budget_id -> string

  const totalDays = daysInMonth(year, month);
  // Dia "efetivo" do mês visualizado: se for o mês atual, usa o dia de hoje (atualizado em tempo real);
  // se for um mês passado, usa o último dia do mês; se for futuro, usa o dia 1.
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const isPastMonth =
    year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1);
  const effectiveDay = isCurrentMonth ? today.getDate() : isPastMonth ? totalDays : 1;

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
    const value = parseAmount(budgetInputs[clientId] ?? String(b.total_budget));
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
    const day = parseInt(dayInputs[budgetId] ?? String(effectiveDay));
    const spent = parseAmount(spentInputs[budgetId] ?? "");
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
            // Usa o ÚLTIMO REGISTRO INSERIDO como referência (recorded_at desc).
            // Ex: se inseri dia 30 e depois dia 20, a referência vira o dia 20.
            const clientSpends = spends
              .filter((s) => s.monthly_budget_id === budget.id)
              .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
            const latest = clientSpends[0];
            // Mostra SEMPRE o último valor salvo (não usa prévia digitada).
            const previewBudget = budget.total_budget;
            const previewSpend = latest?.spent_so_far;
            const avgPerDay = previewBudget > 0 ? previewBudget / totalDays : 0;
            // TODAS as métricas usam o dia do último registro como referência.
            const referenceDay = latest?.day ?? effectiveDay;
            const pctSpent = previewBudget > 0 && previewSpend !== undefined ? (previewSpend / previewBudget) * 100 : 0;
            const pctMonth = Math.min(100, Math.max(0, (referenceDay / totalDays) * 100));
            const diff = previewSpend !== undefined ? pctSpent - pctMonth : 0;
            const color = pacingColor(diff);

            // Projeções baseadas no dia do ÚLTIMO REGISTRO (não no dia real de hoje)
            const daysElapsed = referenceDay;
            const daysRemaining = Math.max(0, totalDays - daysElapsed);
            const dailyPaceSoFar = previewSpend !== undefined && daysElapsed > 0 ? previewSpend / daysElapsed : 0;
            const projectedTotal = previewSpend !== undefined ? dailyPaceSoFar * totalDays : 0;
            const projectionDelta = previewBudget > 0 && previewSpend !== undefined ? projectedTotal - previewBudget : 0;
            const projectionPct = previewBudget > 0 && previewSpend !== undefined ? (projectedTotal / previewBudget) * 100 : 0;

            // Quando o orçamento acabaria mantendo o ritmo atual
            const budgetRemaining = previewBudget > 0 && previewSpend !== undefined ? previewBudget - previewSpend : 0;
            const daysUntilEmpty = dailyPaceSoFar > 0 && budgetRemaining > 0 ? budgetRemaining / dailyPaceSoFar : 0;
            const totalDaysToEmpty = dailyPaceSoFar > 0 ? previewBudget / dailyPaceSoFar : 0;
            const exhaustDayOfMonth = referenceDay + daysUntilEmpty; // dia do mês em que zera
            const exhaustDate = dailyPaceSoFar > 0 && previewSpend !== undefined && budgetRemaining > 0
              ? new Date(year, month - 1, 1 + Math.floor(exhaustDayOfMonth) - 1)
              : null;
            const alreadyExhausted = previewSpend !== undefined && previewBudget > 0 && previewSpend >= previewBudget;
            const willExhaustBeforeMonthEnds = exhaustDayOfMonth > 0 && exhaustDayOfMonth <= totalDays && !alreadyExhausted;
            const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

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
                    {previewBudget > 0 && previewSpend !== undefined && (
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
                  {previewBudget > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Orçamento total" value={fmtBRL(previewBudget)} />
                        <Stat label="Média ideal/dia" value={fmtBRL(avgPerDay)} />
                        <Stat
                          label="Gasto até o último registro"
                          value={previewSpend !== undefined ? fmtBRL(previewSpend) : "—"}
                          sub={previewSpend !== undefined ? `Último registro: dia ${latest?.day}/${totalDays}` : "Sem registros"}
                        />
                        <Stat
                          label="% gasto vs % do mês"
                          value={previewSpend !== undefined ? `${pctSpent.toFixed(1)}% / ${pctMonth.toFixed(1)}%` : `— / ${pctMonth.toFixed(1)}%`}
                          sub={previewSpend !== undefined ? `Referência: dia ${referenceDay}` : undefined}
                        />
                      </div>

                      {previewSpend !== undefined && daysElapsed > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <Stat
                            label="Ritmo atual/dia"
                            value={fmtBRL(dailyPaceSoFar)}
                            sub={`Baseado no último registro (dia ${referenceDay}) · ${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`}
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
                          <div className={`p-3 rounded-lg border ${color.ring} ${color.bg}`}>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" /> Orçamento acaba em
                            </div>
                            {alreadyExhausted ? (
                              <>
                                <div className={`text-lg font-semibold mt-1 ${color.text}`}>Já estourou</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {fmtBRL(previewSpend - previewBudget)} acima do orçamento
                                </div>
                              </>
                            ) : dailyPaceSoFar <= 0 ? (
                              <>
                                <div className="text-lg font-semibold mt-1">—</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">Sem ritmo de gasto</div>
                              </>
                            ) : (
                              <>
                                <div className={`text-lg font-semibold mt-1 ${color.text}`}>
                                  {exhaustDate ? fmtDate(exhaustDate) : `Dia ${Math.ceil(exhaustDayOfMonth)}`}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  Em ~{Math.ceil(daysUntilEmpty)} {Math.ceil(daysUntilEmpty) === 1 ? "dia" : "dias"} ({totalDaysToEmpty.toFixed(1)}d no total · {willExhaustBeforeMonthEnds ? "antes do fim do mês" : "depois do fim do mês"})
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Atualização diária */}
                  <div className="grid md:grid-cols-[140px_1fr_auto] gap-3 items-end p-4 rounded-xl bg-surface-2/40 border border-glass-border">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" /> Dia do mês
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={totalDays}
                          placeholder={String(effectiveDay)}
                          value={dayInputs[budget.id] ?? String(effectiveDay)}
                          onChange={(e) => setDayInputs((p) => ({ ...p, [budget.id]: e.target.value }))}
                          className="bg-background pr-12"
                        />
                        {isCurrentMonth && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-gold/90 bg-gold/10 px-1.5 py-0.5 rounded">
                            hoje
                          </span>
                        )}
                      </div>
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
