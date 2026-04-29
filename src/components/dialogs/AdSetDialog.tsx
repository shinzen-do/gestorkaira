import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type AdSet } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  campaignId: string;
  adSet?: AdSet;
}

export function AdSetDialog({ trigger, campaignId, adSet }: Props) {
  const { createAdSet, updateAdSet } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("0");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && adSet) { setName(adSet.name); setBudget(String(adSet.budget)); setStatus(adSet.status); }
    else if (open) { setName(""); setBudget("0"); setStatus("active"); }
  }, [open, adSet]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      if (adSet) {
        await updateAdSet(adSet.id, { name: name.trim(), budget: Number(budget) || 0, status });
        toast.success("Conjunto atualizado");
      } else {
        await createAdSet({ campaign_id: campaignId, name: name.trim(), budget: Number(budget) || 0 });
        toast.success("Conjunto criado");
      }
      setOpen(false);
    } catch (e: any) { toast.error("Erro ao salvar", { description: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{adSet ? "Editar conjunto de anúncios" : "Novo conjunto de anúncios"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: CA — Lookalike compradoras" /></div>
          <div className="space-y-1.5"><Label>Orçamento (R$)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          {adSet && (
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
