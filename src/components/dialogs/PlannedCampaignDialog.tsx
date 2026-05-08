import { useEffect, useState, ReactNode } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAppData, type PlannedCampaign, type BudgetType, type PlannedStatus } from "@/contexts/AppDataContext";
import { toast } from "sonner";
import { useDialogPersist } from "@/hooks/useDraft";

interface Props {
  trigger: ReactNode;
  clientId?: string; // se vier definido, fixa o cliente
  planned?: PlannedCampaign;
}

export function PlannedCampaignDialog({ trigger, clientId, planned }: Props) {
  const { clients, createPlannedCampaign, updatePlannedCampaign } = useAppData();
  const [open, setOpen] = useDialogPersist(`planned:${planned?.id ?? `new-${clientId ?? "any"}`}`);

  const [selectedClient, setSelectedClient] = useState<string>(clientId ?? planned?.client_id ?? "");
  const [name, setName] = useState(planned?.name ?? "");
  const [objective, setObjective] = useState(planned?.objective ?? "");
  const [start, setStart] = useState<Date | undefined>(planned ? parseISO(planned.start_date) : undefined);
  const [end, setEnd] = useState<Date | undefined>(planned ? parseISO(planned.end_date) : undefined);
  const [budgetType, setBudgetType] = useState<BudgetType>(planned?.budget_type ?? "daily");
  const [daily, setDaily] = useState<string>(planned?.daily_amount ? String(planned.daily_amount) : "");
  const [total, setTotal] = useState<string>(planned?.total_amount ? String(planned.total_amount) : "");
  const [status, setStatus] = useState<PlannedStatus>(planned?.status ?? "planned");
  const [notes, setNotes] = useState(planned?.notes ?? "");

  useEffect(() => {
    if (open && !planned) {
      setSelectedClient(clientId ?? "");
      setName(""); setObjective(""); setStart(undefined); setEnd(undefined);
      setBudgetType("daily"); setDaily(""); setTotal(""); setStatus("planned"); setNotes("");
    }
  }, [open, clientId, planned]);

  const days = start && end ? Math.max(1, differenceInCalendarDays(end, start) + 1) : 0;
  const dailyNum = Number(daily) || 0;
  const totalNum = Number(total) || 0;
  const projectedTotal = budgetType === "daily" ? dailyNum * days : totalNum;

  const submit = async () => {
    if (!selectedClient) return toast.error("Selecione o cliente");
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (!start || !end) return toast.error("Defina datas de início e término");
    if (end < start) return toast.error("Data final antes da inicial");
    if (budgetType === "daily" && dailyNum <= 0) return toast.error("Informe o valor diário");
    if (budgetType === "total" && totalNum <= 0) return toast.error("Informe o orçamento total");

    const payload = {
      client_id: selectedClient,
      name: name.trim(),
      objective: objective.trim() || null,
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
      budget_type: budgetType,
      daily_amount: budgetType === "daily" ? dailyNum : 0,
      total_amount: budgetType === "total" ? totalNum : projectedTotal,
      status,
      notes: notes.trim() || null,
    };

    try {
      if (planned) {
        await updatePlannedCampaign(planned.id, payload);
        toast.success("Programação atualizada");
      } else {
        await createPlannedCampaign(payload);
        toast.success("Campanha programada");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{planned ? "Editar programação" : "Nova campanha programada"}</DialogTitle>
          <DialogDescription>Defina o que vai rodar, quando e quanto vai gastar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {!clientId && (
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder="Escolher cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Black Friday" />
            </div>
            <div className="space-y-1.5">
              <Label>Objetivo</Label>
              <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Vendas, Tráfego..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !start && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {start ? format(start, "dd/MM/yyyy", { locale: ptBR }) : "Escolher"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={start} onSelect={setStart} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Término *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !end && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {end ? format(end, "dd/MM/yyyy", { locale: ptBR }) : "Escolher"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={end} onSelect={setEnd} initialFocus locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de orçamento</Label>
              <Select value={budgetType} onValueChange={(v) => setBudgetType(v as BudgetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="total">Total (vitalício)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlannedStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejada</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {budgetType === "daily" ? (
            <div className="space-y-1.5">
              <Label>Valor diário (R$) *</Label>
              <Input type="number" step="0.01" min={0} value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="Ex: 50" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Orçamento total (R$) *</Label>
              <Input type="number" step="0.01" min={0} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Ex: 1500" />
            </div>
          )}

          {days > 0 && (
            <div className="rounded-lg border border-cobalt/30 bg-cobalt/5 p-3 text-xs text-foreground">
              <p className="text-muted-foreground">Resumo</p>
              <p className="mt-1">
                <strong>{days}</strong> {days === 1 ? "dia" : "dias"} de veiculação · Total estimado: <strong className="text-cobalt">R$ {projectedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>{planned ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
