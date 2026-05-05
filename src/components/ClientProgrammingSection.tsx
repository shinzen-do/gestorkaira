import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalIcon, Pencil, Trash2, Plus, Sparkles } from "lucide-react";
import { useAppData, type PlannedCampaign } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PlannedCampaignDialog } from "@/components/dialogs/PlannedCampaignDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export function plannedTotal(p: PlannedCampaign): number {
  if (p.budget_type === "total") return Number(p.total_amount) || 0;
  const days = Math.max(1, differenceInCalendarDays(parseISO(p.end_date), parseISO(p.start_date)) + 1);
  return (Number(p.daily_amount) || 0) * days;
}

export function ClientProgrammingSection({ clientId, monthlyBudget }: { clientId: string; monthlyBudget: number }) {
  const { plannedCampaigns, deletePlannedCampaign } = useAppData();
  const items = plannedCampaigns
    .filter((p) => p.client_id === clientId && p.status !== "cancelled")
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const totalPlanned = items.reduce((s, p) => s + plannedTotal(p), 0);
  const remaining = monthlyBudget - totalPlanned;
  const overflowPct = monthlyBudget > 0 ? ((totalPlanned - monthlyBudget) / monthlyBudget) * 100 : 0;
  const underUsedPct = monthlyBudget > 0 ? ((monthlyBudget - totalPlanned) / monthlyBudget) * 100 : 0;

  // Cores do alerta:
  // - Acima do orçamento por > 3% → vermelho
  // - Abaixo do orçamento por > 3% (sobra) → amarelo
  // - Próximo (±3%) → verde
  let badgeColor = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  let label = "Dentro do orçamento";
  if (monthlyBudget > 0) {
    if (overflowPct > 3) {
      badgeColor = "border-destructive/50 bg-destructive/10 text-destructive";
      label = `Acima do orçamento em ${overflowPct.toFixed(1)}%`;
    } else if (underUsedPct > 3) {
      badgeColor = "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      label = `Sobra ${underUsedPct.toFixed(1)}% do orçamento`;
    }
  } else {
    badgeColor = "border-border bg-secondary text-muted-foreground";
    label = "Defina o orçamento mensal do cliente";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> Programação do mês
          </p>
          <p className="text-[11px] text-muted-foreground">Planeje campanhas futuras com início, término e orçamento.</p>
        </div>
        <PlannedCampaignDialog
          clientId={clientId}
          trigger={<Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Nova programação</Button>}
        />
      </div>

      {/* Resumo orçamento vs planejado */}
      <div className={cn("rounded-lg border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs", badgeColor)}>
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Orçamento mensal</p>
          <p className="text-base font-semibold mt-0.5">{fmtBRL(monthlyBudget)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-70">Total planejado</p>
          <p className="text-base font-semibold mt-0.5">{fmtBRL(totalPlanned)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-70">{remaining >= 0 ? "Restante" : "Excedido"}</p>
          <p className="text-base font-semibold mt-0.5">{fmtBRL(Math.abs(remaining))}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end">
          <span className="text-[11px] font-medium">{label}</span>
        </div>
      </div>

      {/* Lista de campanhas planejadas */}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
          Nenhuma campanha programada ainda.
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((p) => {
            const days = Math.max(1, differenceInCalendarDays(parseISO(p.end_date), parseISO(p.start_date)) + 1);
            const total = plannedTotal(p);
            return (
              <div key={p.id} className="rounded-lg border border-border bg-card/40 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    {p.objective && <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{p.objective}</span>}
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border",
                      p.status === "active" ? "bg-cobalt/10 text-cobalt border-cobalt/30" :
                      "bg-secondary text-muted-foreground border-border"
                    )}>
                      {p.status === "active" ? "Ativa" : "Planejada"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    <CalIcon className="w-3 h-3" />
                    {format(parseISO(p.start_date), "dd MMM", { locale: ptBR })} → {format(parseISO(p.end_date), "dd MMM yyyy", { locale: ptBR })}
                    <span>· {days} {days === 1 ? "dia" : "dias"}</span>
                    <span>· {p.budget_type === "daily" ? `${fmtBRL(Number(p.daily_amount))}/dia` : `${fmtBRL(Number(p.total_amount))} total`}</span>
                    <span className="text-cobalt font-medium">· Total: {fmtBRL(total)}</span>
                  </p>
                  {p.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <PlannedCampaignDialog
                    clientId={clientId}
                    planned={p}
                    trigger={<button title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>}
                  />
                  <ConfirmDialog
                    title="Excluir programação?"
                    description={`"${p.name}" será removida.`}
                    confirmLabel="Excluir"
                    destructive
                    onConfirm={() => deletePlannedCampaign(p.id).then(() => toast.success("Removida"))}
                    trigger={<button title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
