import { useEffect, useMemo, useState } from "react";
import { errMsg } from "@/lib/errors";
import { motion } from "framer-motion";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Circle, Sparkles, Play, Square, Trash2, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiTask {
  id: string; title: string; description: string | null;
  priority: string; due_date: string | null; done: boolean;
}

export default function TasksPage() {
  useDocumentTitle("Tarefas");
  const { user } = useAuth();
  const { plannedCampaigns, clients, updatePlannedCampaign, calendarNotes, toggleCalendarNote } = useAppData();
  const [aiTasks, setAiTasks] = useState<AiTask[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const today = startOfDay(new Date());

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("ai_tasks").select("*").order("created_at", { ascending: false });
      setAiTasks((data ?? []) as AiTask[]);
    })();
  }, [user]);

  const toActivate = useMemo(() =>
    plannedCampaigns.filter((p) => p.status === "planned" && !isBefore(today, parseISO(p.start_date))),
  [plannedCampaigns]);
  const toDeactivate = useMemo(() =>
    plannedCampaigns.filter((p) => p.status === "active" && isBefore(parseISO(p.end_date), today)),
  [plannedCampaigns]);
  const todaysNotes = useMemo(() =>
    calendarNotes.filter((n) => !n.done && (isToday(parseISO(n.date)) || isBefore(parseISO(n.date), today))),
  [calendarNotes]);

  const submitAi = async () => {
    if (!text.trim()) return toast.error("Cole alguma mensagem ou texto primeiro");
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-summarize-tasks", { body: { text } });
      if (error) throw error;
      const tasks = (data?.tasks ?? []) as { title: string; description?: string; priority?: string; due_date?: string }[];
      if (tasks.length === 0) { toast.info("A IA não encontrou tarefas claras."); setThinking(false); return; }
      const rows = tasks.map((t) => ({
        user_id: user!.id, title: t.title, description: t.description ?? null,
        priority: t.priority ?? "medium", due_date: t.due_date ?? null, source: "ai",
      }));
      const { data: inserted, error: insErr } = await supabase.from("ai_tasks").insert(rows).select();
      if (insErr) throw insErr;
      setAiTasks((p) => [...((inserted ?? []) as AiTask[]), ...p]);
      setText("");
      toast.success(`${tasks.length} tarefa(s) criadas pela IA`);
    } catch (e) {
      toast.error("Erro com a IA", { description: errMsg(e) });
    } finally { setThinking(false); }
  };

  const toggleAi = async (t: AiTask) => {
    const { error } = await supabase.from("ai_tasks").update({ done: !t.done }).eq("id", t.id);
    if (!error) setAiTasks((p) => p.map((x) => x.id === t.id ? { ...x, done: !t.done } : x));
  };
  const removeAi = async (id: string) => {
    await supabase.from("ai_tasks").delete().eq("id", id);
    setAiTasks((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl sm:text-3xl text-foreground">Tarefas</h1>
        <p className="text-sm text-muted-foreground mt-1">Tudo que precisa da sua atenção: campanhas a ativar/desativar, lembretes e tarefas geradas por IA.</p>
      </motion.div>

      <Card className="glass-card border-cobalt/30"><CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-cobalt" /><h2 className="text-sm font-semibold">Pedir à IA para resumir em tarefas</h2></div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Cole briefing, mensagem do cliente ou anotação livre. A IA extrai tarefas com prazo e prioridade."
        />
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground max-w-md">
            Funciona melhor com texto corrido: briefings, mensagens de WhatsApp, anotações de reunião. A IA extrai prazos e prioridades.
          </p>
          <Button onClick={submitAi} disabled={thinking || !text.trim()}>{thinking ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Analisando...</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Gerar tarefas</>}</Button>
        </div>
      </CardContent></Card>

      <Section title="Campanhas para ativar hoje" icon={<Play className="w-4 h-4 text-emerald-400" />} empty="Nada para ativar.">
        {toActivate.map((p) => {
          const cl = clients.find((c) => c.id === p.client_id);
          return (
            <Row key={p.id} title={p.name} subtitle={`${cl?.name ?? ""} · início ${format(parseISO(p.start_date), "dd MMM", { locale: ptBR })}`}>
              <Button size="sm" onClick={() => updatePlannedCampaign(p.id, { status: "active" }).then(() => toast.success("Ativada"))}>Marcar ativada</Button>
            </Row>
          );
        })}
      </Section>

      <Section title="Campanhas para desativar" icon={<Square className="w-4 h-4 text-orange-400" />} empty="Nada para desativar.">
        {toDeactivate.map((p) => {
          const cl = clients.find((c) => c.id === p.client_id);
          return (
            <Row key={p.id} title={p.name} subtitle={`${cl?.name ?? ""} · término ${format(parseISO(p.end_date), "dd MMM", { locale: ptBR })}`}>
              <Button size="sm" variant="outline" onClick={() => updatePlannedCampaign(p.id, { status: "cancelled" }).then(() => toast.success("Encerrada"))}>Marcar encerrada</Button>
            </Row>
          );
        })}
      </Section>

      <Section title="Lembretes do calendário" icon={<Circle className="w-4 h-4 text-gold" />} empty="Sem lembretes pendentes.">
        {todaysNotes.map((n) => (
          <Row key={n.id} title={n.title} subtitle={format(parseISO(n.date), "dd MMM yyyy", { locale: ptBR })}>
            <Button size="sm" variant="ghost" onClick={() => toggleCalendarNote(n.id)}><CheckCircle2 className="w-4 h-4" /></Button>
          </Row>
        ))}
      </Section>

      <Section title="Tarefas geradas pela IA" icon={<Wand2 className="w-4 h-4 text-cobalt" />} empty="Nenhuma tarefa por aqui ainda.">
        {aiTasks.map((t) => (
          <Row key={t.id} title={t.title} subtitle={t.description ?? undefined} done={t.done}>
            <Button size="sm" variant="ghost" onClick={() => toggleAi(t)}>{t.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}</Button>
            <ConfirmDialog
              title="Excluir tarefa?"
              description={t.title}
              confirmLabel="Excluir"
              destructive
              onConfirm={() => removeAi(t.id)}
              trigger={<Button size="sm" variant="ghost"><Trash2 className="w-4 h-4" /></Button>}
            />
          </Row>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children];
  const has = arr.filter(Boolean).length > 0;
  return (
    <Card className="glass-card"><CardContent className="pt-5 space-y-2">
      <h2 className="text-sm font-semibold flex items-center gap-2">{icon} {title}</h2>
      {has ? <div className="space-y-1.5">{children}</div> : <p className="text-xs text-muted-foreground py-3 text-center">{empty}</p>}
    </CardContent></Card>
  );
}

function Row({ title, subtitle, done, children }: { title: string; subtitle?: string; done?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded border border-border bg-secondary/20">
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-foreground ${done ? "line-through opacity-60" : ""}`}>{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">{children}</div>
    </div>
  );
}
