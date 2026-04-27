import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import type { TimelineEntry } from "@/data/mockData";
import { toast } from "sonner";

interface AddChangeDialogProps {
  targetType: "campaign" | "adset" | "audience";
  targetId: string;
  targetName: string;
  trigger: React.ReactNode;
}

const typeOptions: { value: TimelineEntry["type"]; label: string }[] = [
  { value: "creative", label: "Criativo" },
  { value: "budget", label: "Orçamento" },
  { value: "audience", label: "Público" },
  { value: "bid", label: "Lance" },
  { value: "status", label: "Status" },
  { value: "note", label: "Nota" },
];

export function AddChangeDialog({ targetType, targetId, targetName, trigger }: AddChangeDialogProps) {
  const { addTimelineEntry } = useAppData();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TimelineEntry["type"]>("note");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [impact, setImpact] = useState<"positive" | "negative" | "neutral">("neutral");

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    addTimelineEntry({
      targetType,
      targetId,
      entry: { type, description, details: details || undefined, impact },
    });
    toast.success("Mudança registrada", { description: targetName });
    setDescription("");
    setDetails("");
    setImpact("neutral");
    setType("note");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle>Registrar mudança</DialogTitle>
          <DialogDescription>{targetName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TimelineEntry["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Subiu orçamento de R$1.000 para R$1.500" />
          </div>
          <div className="space-y-2">
            <Label>Detalhes (opcional)</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Contexto adicional, métricas, motivo..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Impacto</Label>
            <Select value={impact} onValueChange={(v) => setImpact(v as typeof impact)}>
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
          <Button onClick={handleSubmit}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
