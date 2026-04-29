import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type Client } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  client?: Client; // se passar, é edição
}

export function ClientDialog({ trigger, client }: Props) {
  const { createClient, updateClient } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("0");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setName(client.name);
      setIndustry(client.industry ?? "");
      setBudget(String(client.monthly_budget ?? 0));
      setStatus(client.status);
      setNotes(client.notes ?? "");
    } else if (open) {
      setName(""); setIndustry(""); setBudget("0"); setStatus("active"); setNotes("");
    }
  }, [open, client]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        industry: industry.trim() || undefined,
        monthly_budget: Number(budget) || 0,
        notes: notes.trim() || undefined,
      };
      if (client) {
        await updateClient(client.id, { ...payload, status });
        toast.success("Cliente atualizado");
      } else {
        await createClient(payload);
        toast.success("Cliente criado");
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
          <DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>{client ? "Atualize os dados do cliente." : "Cadastre um novo cliente."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Acme Cosméticos" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Indústria / Nicho</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ex.: E-commerce" /></div>
            <div className="space-y-1.5"><Label>Orçamento mensal (R$)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          </div>
          {client && (
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
          <div className="space-y-1.5"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Contexto, contato, objetivos..." /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
