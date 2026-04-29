import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type Campaign } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  clientId: string;
  campaign?: Campaign;
}

const objectives = ["Vendas", "Geração de Leads", "Conversão", "Tráfego", "Engajamento", "Reconhecimento", "Inscrições", "Mensagens"];

export function CampaignDialog({ trigger, clientId, campaign }: Props) {
  const { createCampaign, updateCampaign } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("Vendas");
  const [budget, setBudget] = useState("0");
  const [spend, setSpend] = useState("0");
  const [roas, setRoas] = useState("0");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && campaign) {
      setName(campaign.name); setObjective(campaign.objective ?? "Vendas");
      setBudget(String(campaign.budget)); setSpend(String(campaign.spend));
      setRoas(String(campaign.roas)); setStatus(campaign.status);
    } else if (open) {
      setName(""); setObjective("Vendas"); setBudget("0"); setSpend("0"); setRoas("0"); setStatus("active");
    }
  }, [open, campaign]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      if (campaign) {
        await updateCampaign(campaign.id, {
          name: name.trim(), objective, budget: Number(budget) || 0,
          spend: Number(spend) || 0, roas: Number(roas) || 0, status,
        });
        toast.success("Campanha atualizada");
      } else {
        await createCampaign({ client_id: clientId, name: name.trim(), objective, budget: Number(budget) || 0 });
        toast.success("Campanha criada");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          <DialogDescription>{campaign ? "Atualize os dados da campanha." : "Crie uma nova campanha para este cliente."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Black Friday — Conversão" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Objetivo</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{objectives.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Orçamento (R$)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          </div>
          {campaign && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Gasto (R$)</Label><Input type="number" value={spend} onChange={(e) => setSpend(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>ROAS</Label><Input type="number" step="0.1" value={roas} onChange={(e) => setRoas(e.target.value)} /></div>
              </div>
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
            </>
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
