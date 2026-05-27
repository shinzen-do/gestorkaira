import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Users as UsersIcon, Instagram, Facebook, History } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "sonner";

interface Snap {
  id: string; client_id: string; date: string;
  instagram: number | null; facebook: number | null; tiktok: number | null;
}

export default function FollowersPage() {
  useDocumentTitle("Seguidores");
  const { user } = useAuth();
  const { clients } = useAppData();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [instagram, setInstagram] = useState("");
  const [showFb, setShowFb] = useState(false);
  const [showTt, setShowTt] = useState(false);
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("follower_snapshots").select("*").order("date", { ascending: false });
      setSnaps((data ?? []) as Snap[]);
    })();
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!clientId) return toast.error("Escolha o cliente");
    if (!instagram && !facebook && !tiktok) return toast.error("Informe ao menos uma rede");
    setSaving(true);
    const payload = {
      user_id: user.id, client_id: clientId, date,
      instagram: instagram ? Number(instagram) : null,
      facebook: showFb && facebook ? Number(facebook) : null,
      tiktok: showTt && tiktok ? Number(tiktok) : null,
    };
    const { data, error } = await supabase.from("follower_snapshots")
      .upsert(payload, { onConflict: "user_id,client_id,date" })
      .select().single();
    setSaving(false);
    if (error) return toast.error("Erro ao salvar", { description: error.message });
    setSnaps((p) => [data as Snap, ...p.filter((x) => x.id !== (data as Snap).id)]);
    setInstagram(""); setFacebook(""); setTiktok("");
    toast.success("Registro salvo");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("follower_snapshots").delete().eq("id", id);
    if (error) return toast.error("Erro");
    setSnaps((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl text-foreground">Seguidores</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre quantos seguidores cada cliente tem em cada rede e acompanhe a evolução.</p>
      </motion.div>

      {clients.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Cadastre um cliente primeiro"
          description="Pra registrar seguidores você precisa de ao menos um cliente em Clientes."
        />
      ) : (
      <>
      <Card className="glass-card"><CardContent className="pt-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-400" />
            <Label className="flex-1">Instagram</Label>
            <Input type="number" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Ex: 12500" className="max-w-[180px]" />
          </div>
          {showFb ? (
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-400" />
              <Label className="flex-1">Facebook</Label>
              <Input type="number" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="max-w-[180px]" />
              <Button size="sm" variant="ghost" onClick={() => { setShowFb(false); setFacebook(""); }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ) : null}
          {showTt ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold">T</span>
              <Label className="flex-1">TikTok</Label>
              <Input type="number" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="max-w-[180px]" />
              <Button size="sm" variant="ghost" onClick={() => { setShowTt(false); setTiktok(""); }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ) : null}
          <div className="flex gap-2">
            {!showFb && <Button size="sm" variant="outline" onClick={() => setShowFb(true)}><Plus className="w-3 h-3 mr-1" /> Facebook</Button>}
            {!showTt && <Button size="sm" variant="outline" onClick={() => setShowTt(true)}><Plus className="w-3 h-3 mr-1" /> TikTok</Button>}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </div>
      </CardContent></Card>

      <Card className="glass-card"><CardContent className="pt-5 space-y-2">
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><UsersIcon className="w-4 h-4 text-cobalt" /> Histórico</h2>
        {snaps.length === 0 ? (
          <div className="py-2">
            <EmptyState
              icon={History}
              title="Sem registros ainda"
              description="Registre o primeiro snapshot acima — depois você vê a evolução por rede aqui."
            />
          </div>
        ) : snaps.map((s) => {
          const cl = clients.find((c) => c.id === s.client_id);
          return (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded border border-border bg-secondary/20 text-sm">
              <span className="font-medium text-foreground min-w-[120px]">{cl?.name ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(s.date), "dd MMM yyyy", { locale: ptBR })}</span>
              <span className="ml-auto flex items-center gap-3 text-xs">
                {s.instagram != null && <span className="text-pink-400">IG {s.instagram.toLocaleString("pt-BR")}</span>}
                {s.facebook != null && <span className="text-blue-400">FB {s.facebook.toLocaleString("pt-BR")}</span>}
                {s.tiktok != null && <span>TT {s.tiktok.toLocaleString("pt-BR")}</span>}
              </span>
              <ConfirmDialog
                title="Excluir registro?"
                description={`Snapshot de ${cl?.name ?? "—"} em ${format(new Date(s.date), "dd MMM yyyy", { locale: ptBR })}.`}
                confirmLabel="Excluir"
                destructive
                onConfirm={() => remove(s.id)}
                trigger={<button className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
              />
            </div>
          );
        })}
      </CardContent></Card>
      </>
      )}
    </div>
  );
}
