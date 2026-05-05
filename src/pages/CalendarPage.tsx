import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, isSameDay, isBefore, startOfDay, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, Circle, AlertTriangle, Clock, Link2, History } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppData, type CalendarPriority, type CalendarLinkType, type CalendarNote, type TimelineEntry } from "@/contexts/AppDataContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const priorityStyles: Record<CalendarPriority, string> = {
  low: "text-muted-foreground bg-secondary border-border",
  medium: "text-gold bg-gold/10 border-gold/20",
  high: "text-destructive bg-destructive/10 border-destructive/20",
};
const priorityLabel: Record<CalendarPriority, string> = { low: "Baixa", medium: "Média", high: "Alta" };

function NewNoteDialog({ defaultDate }: { defaultDate?: Date }) {
  const { addCalendarNote, clients, audiences, campaigns } = useAppData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(defaultDate ?? new Date());
  const [priority, setPriority] = useState<CalendarPriority>("medium");
  const [linkType, setLinkType] = useState<CalendarLinkType>("none");
  const [linkId, setLinkId] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    if (!date) return toast.error("Selecione uma data");
    try {
      await addCalendarNote({
        title: title.trim(),
        description: description.trim() || null,
        date: date.toISOString().slice(0, 10),
        priority,
        link_type: linkType,
        link_id: linkType === "none" ? null : linkId ?? null,
      });
      toast.success("Anotação criada");
      setTitle(""); setDescription(""); setPriority("medium"); setLinkType("none"); setLinkId(undefined);
      setOpen(false);
    } catch (e: any) { toast.error("Erro", { description: e.message }); }
  };

  const campsLabeled = campaigns.map((c) => {
    const cl = clients.find((x) => x.id === c.client_id);
    return { id: c.id, label: `${cl?.name ?? "—"} › ${c.name}` };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> Nova anotação</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova anotação</DialogTitle>
          <DialogDescription>Registre mudanças, prazos e lembretes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Trocar criativo principal" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Data / Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {date ? format(date, "PPP", { locale: ptBR }) : "Escolher data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5"><Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as CalendarPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Vincular a</Label>
              <Select value={linkType} onValueChange={(v) => { setLinkType(v as CalendarLinkType); setLinkId(undefined); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nada</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="campaign">Campanha</SelectItem>
                  <SelectItem value="audience">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkType !== "none" && (
              <div className="space-y-1.5"><Label>Selecione</Label>
                <Select value={linkId} onValueChange={setLinkId}>
                  <SelectTrigger><SelectValue placeholder="Escolher…" /></SelectTrigger>
                  <SelectContent>
                    {linkType === "client" && clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {linkType === "campaign" && campsLabeled.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    {linkType === "audience" && audiences.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  const { calendarNotes, toggleCalendarNote, deleteCalendarNote, clients, audiences, campaigns, timelineEntries, plannedCampaigns } = useAppData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const noteDates = useMemo(() => calendarNotes.filter((n) => !n.done).map((n) => parseISO(n.date)), [calendarNotes]);
  const changeDates = useMemo(() => timelineEntries.map((t) => parseISO(t.occurred_at)), [timelineEntries]);
  const plannedDates = useMemo(() =>
    plannedCampaigns.filter((p) => p.status !== "cancelled").flatMap((p) => [parseISO(p.start_date), parseISO(p.end_date)]),
  [plannedCampaigns]);

  const notesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return calendarNotes.filter((n) => isSameDay(parseISO(n.date), selectedDate));
  }, [calendarNotes, selectedDate]);

  const plannedForSelected = useMemo(() => {
    if (!selectedDate) return [] as { kind: "start" | "end"; p: typeof plannedCampaigns[number] }[];
    const out: { kind: "start" | "end"; p: typeof plannedCampaigns[number] }[] = [];
    plannedCampaigns.forEach((p) => {
      if (p.status === "cancelled") return;
      if (isSameDay(parseISO(p.start_date), selectedDate)) out.push({ kind: "start", p });
      if (isSameDay(parseISO(p.end_date), selectedDate)) out.push({ kind: "end", p });
    });
    return out;
  }, [plannedCampaigns, selectedDate]);

  const changesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return timelineEntries.filter((t) => isSameDay(parseISO(t.occurred_at), selectedDate));
  }, [timelineEntries, selectedDate]);

  const upcoming = useMemo(() =>
    [...calendarNotes].filter((n) => !n.done).sort((a, b) => a.date.localeCompare(b.date)),
  [calendarNotes]);
  const overdue = upcoming.filter((n) => isBefore(parseISO(n.date), today));

  const linkLabel = (n: CalendarNote) => {
    if (n.link_type === "client") return clients.find((c) => c.id === n.link_id)?.name;
    if (n.link_type === "audience") return audiences.find((a) => a.id === n.link_id)?.name;
    if (n.link_type === "campaign") {
      const c = campaigns.find((x) => x.id === n.link_id);
      const cl = c ? clients.find((x) => x.id === c.client_id) : null;
      return c ? `${cl?.name ?? ""} › ${c.name}` : null;
    }
    return null;
  };
  const goToLink = (n: CalendarNote) => {
    if (n.link_type === "client") navigate(`/clients?focus=${n.link_id}`);
    else if (n.link_type === "campaign") {
      const c = campaigns.find((x) => x.id === n.link_id);
      if (c) navigate(`/clients?focus=${c.client_id}`);
    } else if (n.link_type === "audience") navigate(`/audiences`);
  };

  const changeContext = (t: TimelineEntry) => {
    if (t.target_type === "client") return clients.find((c) => c.id === t.target_id)?.name;
    if (t.target_type === "campaign") {
      const c = campaigns.find((x) => x.id === t.target_id);
      const cl = c ? clients.find((x) => x.id === c.client_id) : null;
      return c ? `${cl?.name} › ${c.name}` : "Campanha";
    }
    return t.target_type;
  };

  const NoteCard = ({ n }: { n: CalendarNote }) => {
    const link = linkLabel(n);
    const isOverdue = !n.done && isBefore(parseISO(n.date), today);
    return (
      <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-lg border p-3 flex items-start gap-3 transition-colors",
          n.done ? "bg-secondary/20 border-border opacity-60" : "bg-secondary/30 border-border hover:border-gold/40")}>
        <button onClick={() => toggleCalendarNote(n.id)} className="mt-0.5 shrink-0">
          {n.done ? <CheckCircle2 className="w-4 h-4 text-health-green" /> : <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-medium text-foreground", n.done && "line-through")}>{n.title}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", priorityStyles[n.priority])}>{priorityLabel[n.priority]}</span>
            {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Atrasado</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(parseISO(n.date), "dd 'de' MMM yyyy", { locale: ptBR })}</span>
            {link && <button onClick={() => goToLink(n)} className="flex items-center gap-1 text-cobalt hover:underline"><Link2 className="w-3 h-3" /> {link}</button>}
          </div>
          {n.description && <p className="text-xs text-muted-foreground mt-1.5">{n.description}</p>}
        </div>
        <button onClick={() => { deleteCalendarNote(n.id); toast.success("Anotação removida"); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">Anote prazos e visualize mudanças registradas a cada dia.</p>
        </div>
        <NewNoteDialog defaultDate={selectedDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
              modifiers={{ hasNote: noteDates, hasChange: changeDates }}
              modifiersClassNames={{
                hasNote: "relative font-semibold text-gold",
                hasChange: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-cobalt",
              }}
              className={cn("p-0 pointer-events-auto")} />
          </div>
          <div className="glass-card p-4 space-y-2 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Resumo</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Atrasadas</span><span className="font-semibold text-destructive">{overdue.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-semibold text-gold">{upcoming.length - overdue.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Concluídas</span><span className="font-semibold text-health-green">{calendarNotes.filter((n) => n.done).length}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Mudanças registradas</span><span className="font-semibold text-cobalt">{timelineEntries.length}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedDate && (
            <>
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gold" />
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <div className="space-y-2">
                  {notesForSelected.length === 0
                    ? <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">Nenhuma anotação para este dia.</p>
                    : notesForSelected.map((n) => <NoteCard key={n.id} n={n} />)}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-cobalt" /> Mudanças neste dia
                </h2>
                <div className="space-y-2">
                  {changesForSelected.length === 0
                    ? <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">Nenhuma mudança registrada neste dia.</p>
                    : changesForSelected.map((t) => (
                      <div key={t.id} className="rounded-lg border border-border bg-secondary/30 p-3 flex items-start gap-3">
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                          t.impact === "positive" ? "bg-health-green" : t.impact === "negative" ? "bg-destructive" : "bg-muted-foreground")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{t.description}</p>
                          {t.details && <p className="text-xs text-muted-foreground mt-0.5">{t.details}</p>}
                          <p className="text-[11px] text-muted-foreground mt-1">{changeContext(t)} · {format(parseISO(t.occurred_at), "HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
