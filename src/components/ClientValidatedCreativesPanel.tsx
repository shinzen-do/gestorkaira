import { useState } from "react";
import { Image as ImageIcon, Video, Layers as LayersIcon, Plus, Trash2, CheckCircle2, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import type { ValidatedCreative } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatIcon = { image: ImageIcon, video: Video, carousel: LayersIcon } as const;
const formatLabel = { image: "Estático", video: "Vídeo", carousel: "Carrossel" } as const;

function AddValidatedCreativeDialog({ clientId }: { clientId: string }) {
  const { addValidatedCreative } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<ValidatedCreative["format"]>("video");
  const [validatedBy, setValidatedBy] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome do criativo é obrigatório");
      return;
    }
    addValidatedCreative(clientId, {
      name,
      format,
      validatedBy: validatedBy || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      notes: notes || undefined,
      url: url || undefined,
    });
    toast.success("Criativo validado adicionado");
    setName(""); setValidatedBy(""); setTags(""); setNotes(""); setUrl(""); setFormat("video");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo criativo validado
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle>Adicionar criativo validado</DialogTitle>
          <DialogDescription>Aprovado para uso em campanhas deste cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vídeo UGC depoimento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ValidatedCreative["format"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="image">Estático</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Validado por</Label>
              <Input value={validatedBy} onChange={(e) => setValidatedBy(e.target.value)} placeholder="Diretor criativo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (separe por vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="UGC, Top performer" />
          </div>
          <div className="space-y-2">
            <Label>Link de referência (opcional)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Por que foi aprovado, em quais CAs usar..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientValidatedCreativesPanel({ clientId }: { clientId: string }) {
  const { clients, removeValidatedCreative } = useAppData();
  const client = clients.find((c) => c.id === clientId);
  const list = client?.validatedCreatives ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {list.length} criativo{list.length === 1 ? "" : "s"} aprovado{list.length === 1 ? "" : "s"} — biblioteca de referência.
        </p>
        <AddValidatedCreativeDialog clientId={clientId} />
      </div>
      {list.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
          <Award className="w-5 h-5 mx-auto mb-2 opacity-50" />
          Nenhum criativo validado ainda. Adicione os que provaram performance.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {list.map((cr) => {
            const Icon = formatIcon[cr.format];
            return (
              <motion.div key={cr.id} layout className="rounded-lg border border-border bg-secondary/20 p-3 flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-border bg-gold/10 text-gold")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{cr.name}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-health-green shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatLabel[cr.format]} · validado em {new Date(cr.validatedAt).toLocaleDateString("pt-BR")}
                    {cr.validatedBy && ` por ${cr.validatedBy}`}
                  </p>
                  {cr.tags && cr.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cr.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-cobalt/10 text-cobalt border border-cobalt/20">{t}</span>
                      ))}
                    </div>
                  )}
                  {cr.performance && (
                    <div className="flex gap-3 mt-1.5 text-[11px]">
                      {cr.performance.ctr !== undefined && <span className="text-muted-foreground">CTR <span className="text-foreground font-medium">{cr.performance.ctr.toFixed(1)}%</span></span>}
                      {cr.performance.cpa !== undefined && <span className="text-muted-foreground">CPA <span className="text-foreground font-medium">R${cr.performance.cpa.toFixed(2)}</span></span>}
                      {cr.performance.roas !== undefined && <span className="text-muted-foreground">ROAS <span className="text-foreground font-medium">{cr.performance.roas.toFixed(1)}x</span></span>}
                    </div>
                  )}
                  {cr.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{cr.notes}</p>}
                  {cr.url && (
                    <a href={cr.url} target="_blank" rel="noreferrer" className="text-[11px] text-cobalt hover:underline mt-1 inline-block">
                      Ver referência →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => { removeValidatedCreative(clientId, cr.id); toast.success("Removido"); }}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
