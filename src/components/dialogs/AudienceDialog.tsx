import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppData, type Audience, type Gender } from "@/contexts/AppDataContext";
import { toast } from "sonner";
import { useDraft, useDialogPersist } from "@/hooks/useDraft";

interface Props {
  trigger: React.ReactNode;
  audience?: Audience;
}

export function AudienceDialog({ trigger, audience }: Props) {
  const { createAudience, updateAudience, linkAudienceToCampaigns, audienceCampaigns, clients, campaigns } = useAppData();
  const draftKey = `audience:${audience?.id ?? "new"}`;
  const [open, setOpen] = useDialogPersist(draftKey);
  const [form, setForm, clearDraft] = useDraft(draftKey, {
    name: "", description: "", gender: "all" as Gender,
    ageMin: "18", ageMax: "65", interests: "", size: "",
    status: "active" as "active" | "paused" | "archived",
    selectedCampaigns: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && audience) {
      setForm({
        name: audience.name, description: audience.description ?? "",
        gender: audience.gender, ageMin: String(audience.age_min), ageMax: String(audience.age_max),
        interests: audience.interests.join(", "), size: audience.size_estimate?.toString() ?? "",
        status: audience.status,
        selectedCampaigns: audienceCampaigns.filter((ac) => ac.audience_id === audience.id).map((ac) => ac.campaign_id),
      });
    }
  }, [open, audience, audienceCampaigns]);

  const set = (p: Partial<typeof form>) => setForm({ ...form, ...p });
  const toggleCampaign = (id: string) => set({
    selectedCampaigns: form.selectedCampaigns.includes(id)
      ? form.selectedCampaigns.filter((x) => x !== id)
      : [...form.selectedCampaigns, id],
  });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const interestsArr = form.interests.split(",").map((i) => i.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(), description: form.description.trim() || null,
        gender: form.gender, age_min: Number(form.ageMin) || 18, age_max: Number(form.ageMax) || 65,
        interests: interestsArr, status: form.status,
        size_estimate: form.size ? Number(form.size) : null,
      };
      if (audience) {
        await updateAudience(audience.id, payload);
        await linkAudienceToCampaigns(audience.id, form.selectedCampaigns);
        toast.success("Público atualizado");
      } else {
        await createAudience({ ...payload, campaignIds: form.selectedCampaigns });
        toast.success("Público criado");
      }
      clearDraft();
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
          <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: LAL 1% compradoras 90d" /></div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Gênero</Label>
              <Select value={form.gender} onValueChange={(v) => set({ gender: v as Gender })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Idade mín.</Label><Input type="number" value={form.ageMin} onChange={(e) => set({ ageMin: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Idade máx.</Label><Input type="number" value={form.ageMax} onChange={(e) => set({ ageMax: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Interesses (separe por vírgula)</Label><Input value={form.interests} onChange={(e) => set({ interests: e.target.value })} placeholder="Skincare, Vitamina C, Beleza" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tamanho estimado</Label><Input type="number" value={form.size} onChange={(e) => set({ size: e.target.value })} placeholder="ex.: 240000" /></div>
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
                          <Checkbox checked={form.selectedCampaigns.includes(c.id)} onCheckedChange={() => toggleCampaign(c.id)} />
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
          <Button variant="ghost" onClick={() => { clearDraft(); setOpen(false); }}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
