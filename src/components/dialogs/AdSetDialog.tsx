import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type AdSet, type BudgetType } from "@/contexts/AppDataContext";
import { toast } from "sonner";
import { useDraft, useDialogPersist } from "@/hooks/useDraft";

interface Props {
  trigger: React.ReactNode;
  campaignId: string;
  adSet?: AdSet;
}

export function AdSetDialog({ trigger, campaignId, adSet }: Props) {
  const { createAdSet, updateAdSet, campaigns } = useAppData();
  const parent = campaigns.find((c) => c.id === campaignId);
  const isCBO = (parent as any)?.budget_strategy === "cbo";

  const draftKey = `adset:${adSet?.id ?? `new-${campaignId}`}`;
  const [open, setOpen] = useDialogPersist(draftKey);
  const [form, setForm, clearDraft] = useDraft(draftKey, {
    name: "", budget: "0", budgetType: "daily" as BudgetType,
    status: "active" as "active" | "paused" | "archived",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && adSet) {
      setForm({
        name: adSet.name, budget: String(adSet.budget ?? 0),
        budgetType: adSet.budget_type ?? "daily", status: adSet.status,
      });
    }
  }, [open, adSet]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const budgetVal = isCBO ? 0 : Number(form.budget) || 0;
      if (adSet) {
        await updateAdSet(adSet.id, { name: form.name.trim(), budget: budgetVal, budget_type: form.budgetType, status: form.status });
        toast.success("Conjunto atualizado");
      } else {
        await createAdSet({ campaign_id: campaignId, name: form.name.trim(), budget: budgetVal, budget_type: form.budgetType });
        toast.success("Conjunto criado");
      }
      clearDraft();
      setOpen(false);
    } catch (e: any) { toast.error("Erro ao salvar", { description: e.message }); }
    finally { setSaving(false); }
  };

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{adSet ? "Editar conjunto de anúncios" : "Novo conjunto de anúncios"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: CA — Lookalike compradoras" /></div>
          {isCBO ? (
            <p className="text-[11px] text-muted-foreground rounded-lg border border-cobalt/30 bg-cobalt/5 p-3">
              Esta campanha usa <strong>CBO</strong>: o orçamento é definido na campanha. Não é necessário informar orçamento por conjunto.
            </p>
          ) : (
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
          {adSet && (
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
