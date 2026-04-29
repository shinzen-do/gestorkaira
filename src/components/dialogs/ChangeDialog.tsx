import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type TimelineType, type TargetType, type Impact } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  targetType: TargetType;
  targetId: string;
  targetName: string;
}

const typeOptions: { value: TimelineType; label: string }[] = [
  { value: "creative", label: "Criativo" },
  { value: "budget", label: "Orçamento" },
  { value: "audience", label: "Público" },
  { value: "bid", label: "Lance" },
  { value: "status", label: "Status" },
  { value: "note", label: "Nota" },
];

export function ChangeDialog({ trigger, targetType, targetId, targetName }: Props) {
  const { addTimelineEntry } = useAppData();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TimelineType>("note");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [impact, setImpact] = useState<Impact>("neutral");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!description.trim()) return toast.error("Descrição obrigatória");
    setSaving(true);
    try {
      await addTimelineEntry({
        target_type: targetType, target_id: targetId,
        type, description: description.trim(),
        details: details.trim() || null, impact,
      });
      toast.success("Mudança registrada", { description: targetName });
      setDescription(""); setDetails(""); setImpact("neutral"); setType("note");
      setOpen(false);
    } catch (e: any) { toast.error("Erro ao registrar", { description: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar mudança</DialogTitle>
          <DialogDescription>{targetName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TimelineType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Descrição *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Subiu orçamento de R$1.000 para R$1.500" /></div>
          <div className="space-y-1.5"><Label>Detalhes</Label><Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Contexto, métricas, motivo..." /></div>
          <div className="space-y-1.5"><Label>Impacto</Label>
            <Select value={impact} onValueChange={(v) => setImpact(v as Impact)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">↑ Positivo</SelectItem>
                <SelectItem value="neutral">— Neutro</SelectItem>
                <SelectItem value="negative">↓ Negativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
