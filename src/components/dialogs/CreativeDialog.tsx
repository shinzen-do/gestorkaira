import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type Creative, type CreativeFormat } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  adSetId: string;
  creative?: Creative;
}

export function CreativeDialog({ trigger, adSetId, creative }: Props) {
  const { createCreative, updateCreative } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CreativeFormat>("image");
  const [url, setUrl] = useState("");
  const [ctr, setCtr] = useState("0");
  const [impressions, setImpressions] = useState("0");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && creative) {
      setName(creative.name); setFormat(creative.format); setUrl(creative.url ?? "");
      setCtr(String(creative.ctr)); setImpressions(String(creative.impressions)); setStatus(creative.status);
    } else if (open) {
      setName(""); setFormat("image"); setUrl(""); setCtr("0"); setImpressions("0"); setStatus("active");
    }
  }, [open, creative]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      if (creative) {
        await updateCreative(creative.id, {
          name: name.trim(), format, url: url.trim() || null,
          ctr: Number(ctr) || 0, impressions: Number(impressions) || 0, status,
        });
        toast.success("Criativo atualizado");
      } else {
        await createCreative({ ad_set_id: adSetId, name: name.trim(), format, url: url.trim() || undefined });
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
            <div className="space-y-1.5"><Label>CTR (%)</Label><Input type="number" step="0.01" value={ctr} onChange={(e) => setCtr(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Impressões</Label><Input type="number" value={impressions} onChange={(e) => setImpressions(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
