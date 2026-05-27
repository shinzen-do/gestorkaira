import { useState } from "react";
import { errMsg } from "@/lib/errors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, type CreativeFormat } from "@/contexts/AppDataContext";
import { toast } from "sonner";

export function ValidatedCreativeDialog({ trigger, clientId }: { trigger: React.ReactNode; clientId: string }) {
  const { createValidatedCreative } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CreativeFormat>("image");
  const [url, setUrl] = useState("");
  const [ctr, setCtr] = useState("");
  const [roas, setRoas] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      await createValidatedCreative({
        client_id: clientId, name: name.trim(), format, url: url.trim() || null,
        ctr: ctr ? Number(ctr) : null, roas: roas ? Number(roas) : null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Criativo validado salvo");
      setName(""); setUrl(""); setCtr(""); setRoas(""); setTags(""); setFormat("image");
      setOpen(false);
    } catch (e) { toast.error("Erro ao salvar", { description: errMsg(e) }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar criativo validado</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
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
            <div className="space-y-1.5"><Label>Tags (vírgula)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="UGC, hook forte" /></div>
          </div>
          <div className="space-y-1.5"><Label>Link</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>CTR (%)</Label><Input type="number" step="0.01" value={ctr} onChange={(e) => setCtr(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>ROAS</Label><Input type="number" step="0.1" value={roas} onChange={(e) => setRoas(e.target.value)} /></div>
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
