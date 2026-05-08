import { useEffect } from "react";
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
import { useDraft, useDialogPersist } from "@/hooks/useDraft";
import { useState } from "react";

interface Props {
  trigger: React.ReactNode;
  client?: Client;
}

export function ClientDialog({ trigger, client }: Props) {
  const { createClient, updateClient } = useAppData();
  const draftKey = `client:${client?.id ?? "new"}`;
  const [open, setOpen] = useDialogPersist(draftKey);
  const [form, setForm, clearDraft] = useDraft(draftKey, {
    name: "", industry: "", budget: "0", notes: "",
    status: "active" as "active" | "paused" | "archived",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setForm({
        name: client.name, industry: client.industry ?? "",
        budget: String(client.monthly_budget ?? 0),
        status: client.status, notes: client.notes ?? "",
      });
    }
  }, [open, client]);

  const set = (p: Partial<typeof form>) => setForm({ ...form, ...p });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry.trim() || undefined,
        monthly_budget: Number(form.budget) || 0,
        notes: form.notes.trim() || undefined,
      };
      if (client) {
        await updateClient(client.id, { ...payload, status: form.status });
        toast.success("Cliente atualizado");
      } else {
        await createClient(payload);
        toast.success("Cliente criado");
      }
      clearDraft();
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
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Acme Cosméticos" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Indústria / Nicho</Label><Input value={form.industry} onChange={(e) => set({ industry: e.target.value })} placeholder="Ex.: E-commerce" /></div>
            <div className="space-y-1.5"><Label>Orçamento mensal (R$)</Label><Input type="number" value={form.budget} onChange={(e) => set({ budget: e.target.value })} /></div>
          </div>
          {client && (
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
          <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} placeholder="Contexto, contato, objetivos..." /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { clearDraft(); setOpen(false); }}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
