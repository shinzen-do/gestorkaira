import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppData, type Audience, type Gender } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  audience?: Audience;
}

export function AudienceDialog({ trigger, audience }: Props) {
  const { createAudience, updateAudience, linkAudienceToCampaigns, audienceCampaigns, clients, campaigns } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<Gender>("all");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [interests, setInterests] = useState("");
  const [size, setSize] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "archived">("active");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && audience) {
      setName(audience.name); setDescription(audience.description ?? "");
      setGender(audience.gender); setAgeMin(String(audience.age_min)); setAgeMax(String(audience.age_max));
      setInterests(audience.interests.join(", ")); setSize(audience.size_estimate?.toString() ?? "");
      setStatus(audience.status);
      setSelectedCampaigns(audienceCampaigns.filter((ac) => ac.audience_id === audience.id).map((ac) => ac.campaign_id));
    } else if (open) {
      setName(""); setDescription(""); setGender("all"); setAgeMin("18"); setAgeMax("65");
      setInterests(""); setSize(""); setStatus("active"); setSelectedCampaigns([]);
    }
  }, [open, audience, audienceCampaigns]);

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const submit = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const interestsArr = interests.split(",").map((i) => i.trim()).filter(Boolean);
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        gender, age_min: Number(ageMin) || 18, age_max: Number(ageMax) || 65,
        interests: interestsArr, status,
        size_estimate: size ? Number(size) : null,
      };
      if (audience) {
        await updateAudience(audience.id, payload);
        await linkAudienceToCampaigns(audience.id, selectedCampaigns);
        toast.success("Público atualizado");
      } else {
        await createAudience({ ...payload, campaignIds: selectedCampaigns });
        toast.success("Público criado", { description: selectedCampaigns.length > 0 ? `Vinculado a ${selectedCampaigns.length} campanha(s)` : undefined });
      }
      setOpen(false);
    } catch (e: any) { toast.error("Erro ao salvar", { description: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{audience ? "Editar público" : "Novo público"}</DialogTitle>
          <DialogDescription>Defina segmentação e em quais campanhas este público está ativo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: LAL 1% compradoras 90d" /></div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="O que esse público representa..." /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Gênero</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Idade mín.</Label><Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Idade máx.</Label><Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Interesses (separe por vírgula)</Label><Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Skincare, Vitamina C, Beleza" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tamanho estimado</Label><Input type="number" value={size} onChange={(e) => setSize(e.target.value)} placeholder="ex.: 240000" /></div>
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

          <div className="space-y-2 pt-2 border-t border-border">
            <Label>Ativar nas campanhas</Label>
            {campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground">Você ainda não tem campanhas. Crie uma campanha em um cliente para vincular.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                {clients.map((cl) => {
                  const camps = campaigns.filter((c) => c.client_id === cl.id);
                  if (camps.length === 0) return null;
                  return (
                    <div key={cl.id} className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">{cl.name}</p>
                      {camps.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 cursor-pointer">
                          <Checkbox checked={selectedCampaigns.includes(c.id)} onCheckedChange={() => toggleCampaign(c.id)} />
                          <span className="text-sm text-foreground">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
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
