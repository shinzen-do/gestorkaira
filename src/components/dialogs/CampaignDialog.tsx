import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type Campaign, type BudgetType, type BudgetStrategy } from "@/contexts/AppDataContext";
import { toast } from "sonner";
import { useDraft, useDialogPersist } from "@/hooks/useDraft";

interface Props {
  trigger: React.ReactNode;
  clientId: string;
  campaign?: Campaign;
}

const objectives = ["Vendas", "Geração de Leads", "Conversão", "Tráfego", "Engajamento", "Reconhecimento", "Inscrições", "Mensagens"];

export function CampaignDialog({ trigger, clientId, campaign }: Props) {
  const { createCampaign, updateCampaign } = useAppData();
  const draftKey = `campaign:${campaign?.id ?? `new-${clientId}`}`;
  const [open, setOpen] = useDialogPersist(draftKey);
  const [form, setForm, clearDraft] = useDraft(draftKey, {
    name: "", objective: "Vendas", budget: "0", budgetType: "daily" as BudgetType,
    budgetStrategy: "abo" as BudgetStrategy, spend: "0", roas: "0", status: "active" as "active" | "paused" | "archived",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && campaign) {
      setForm({
        name: campaign.name, objective: campaign.objective ?? "Vendas",
        budget: String(campaign.budget), budgetType: campaign.budget_type ?? "daily",
        budgetStrategy: (campaign as any).budget_strategy ?? "abo",
        spend: String(campaign.spend), roas: String(campaign.roas), status: campaign.status,
      });
    }
  }, [open, campaign]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      if (campaign) {
        await updateCampaign(campaign.id, {
          name: form.name.trim(), objective: form.objective,
          budget: Number(form.budget) || 0, budget_type: form.budgetType, budget_strategy: form.budgetStrategy,
          spend: Number(form.spend) || 0, roas: Number(form.roas) || 0, status: form.status,
        });
        toast.success("Campanha atualizada");
      } else {
        await createCampaign({
          client_id: clientId, name: form.name.trim(), objective: form.objective,
          budget: Number(form.budget) || 0, budget_type: form.budgetType, budget_strategy: form.budgetStrategy,
        });
        toast.success("Campanha criada");
      }
      clearDraft();
      setOpen(false);
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    } finally { setSaving(false); }
  };

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          <DialogDescription>{campaign ? "Atualize os dados da campanha." : "Crie uma nova campanha para este cliente."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Black Friday — Conversão" /></div>
          <div className="space-y-1.5"><Label>Objetivo</Label>
            <Select value={form.objective} onValueChange={(v) => set({ objective: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{objectives.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estratégia de orçamento</Label>
            <Select value={form.budgetStrategy} onValueChange={(v) => set({ budgetStrategy: v as BudgetStrategy })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cbo">CBO — orçamento na campanha</SelectItem>
                <SelectItem value="abo">ABO — orçamento por conjunto</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {form.budgetStrategy === "cbo"
                ? "Você define o valor aqui. Os públicos/conjuntos ficam sem orçamento próprio."
                : "Cada conjunto de anúncios terá o próprio orçamento."}
            </p>
          </div>

          {form.budgetStrategy === "cbo" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tipo de orçamento</Label>
                <Select value={form.budgetType} onValueChange={(v) => set({ budgetType: v as BudgetType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Orçamento {form.budgetType === "daily" ? "diário" : "total"} (R$)</Label>
                <Input type="number" value={form.budget} onChange={(e) => set({ budget: e.target.value })} />
              </div>
            </div>
          )}

          {campaign && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Gasto (R$)</Label><Input type="number" value={form.spend} onChange={(e) => set({ spend: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>ROAS</Label><Input type="number" step="0.1" value={form.roas} onChange={(e) => set({ roas: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set({ status: v as typeof form.status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { clearDraft(); setOpen(false); }}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
