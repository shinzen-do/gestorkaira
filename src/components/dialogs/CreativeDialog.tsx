import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type Creative, type CreativeFormat } from "@/contexts/AppDataContext";
import { toast } from "sonner";
import { useDialogPersist } from "@/hooks/useDraft";

interface Props {
  trigger: React.ReactNode;
  adSetId: string;
  creative?: Creative;
}

const RESULT_LABELS = ["conversas", "leads", "compras", "cadastros", "cliques no link", "instalações", "mensagens", "visualizações"];

export function CreativeDialog({ trigger, adSetId, creative }: Props) {
  const { createCreative, updateCreative } = useAppData();
  const [open, setOpen] = useDialogPersist(`creative:${creative?.id ?? `new-${adSetId}`}`);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CreativeFormat>("image");
  const [url, setUrl] = useState("");
  const [results, setResults] = useState("0");
  const [resultLabel, setResultLabel] = useState("conversas");
  const [costPerResult, setCostPerResult] = useState("0");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && creative) {
      setName(creative.name); setFormat(creative.format); setUrl(creative.url ?? "");
      setResults(String(creative.results ?? 0));
      setResultLabel(creative.result_label ?? "conversas");
      setCostPerResult(String(creative.cost_per_result ?? 0));
      setStatus(creative.status);
    } else if (open) {
      setName(""); setFormat("image"); setUrl("");
      setResults("0"); setResultLabel("conversas"); setCostPerResult("0"); setStatus("active");
    }
  }, [open, creative]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      if (creative) {
        await updateCreative(creative.id, {
          name: name.trim(), format, url: url.trim() || null,
          results: Number(results) || 0, result_label: resultLabel,
          cost_per_result: Number(costPerResult) || 0, status,
        });
        toast.success("Criativo atualizado");
      } else {
        await createCreative({ ad_set_id: adSetId, name: name.trim(), format, url: url.trim() || undefined, result_label: resultLabel });
        toast.success("Criativo criado");
      }
      setOpen(false);
    } catch (e: any) { toast.error("Erro ao salvar", { description: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{creative ? "Editar criativo" : "Novo criativo"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vídeo UGC — Depoimento" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as CreativeFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <div className="space-y-1.5"><Label>Link do criativo (URL)</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/... ou https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tipo de resultado</Label>
              <Select value={resultLabel} onValueChange={setResultLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESULT_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Resultados (qtd.)</Label><Input type="number" value={results} onChange={(e) => setResults(e.target.value)} placeholder="Ex.: 25" /></div>
          </div>
          <div className="space-y-1.5"><Label>Custo por resultado aprox. (R$)</Label><Input type="number" step="0.01" value={costPerResult} onChange={(e) => setCostPerResult(e.target.value)} placeholder="Ex.: 4.80" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
