import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, isSameDay, isAfter, isBefore, startOfDay, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Trash2, CheckCircle2, Circle, AlertTriangle, Clock, Link2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppData, type CalendarPriority, type CalendarLinkType } from "@/contexts/AppDataContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const priorityStyles: Record<CalendarPriority, string> = {
  low: "text-muted-foreground bg-secondary border-border",
  medium: "text-cobalt bg-cobalt/10 border-cobalt/20",
  high: "text-destructive bg-destructive/10 border-destructive/20",
};

const priorityLabel: Record<CalendarPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

function NewNoteDialog({ defaultDate }: { defaultDate?: Date }) {
  const { addCalendarNote, clients, audiences } = useAppData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(defaultDate ?? new Date());
  const [priority, setPriority] = useState<CalendarPriority>("medium");
  const [linkType, setLinkType] = useState<CalendarLinkType>("none");
  const [linkId, setLinkId] = useState<string | undefined>();

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    if (!date) return toast.error("Selecione uma data");
    addCalendarNote({
      title,
      description: description || undefined,
      date: date.toISOString().slice(0, 10),
      priority,
      linkType,
      linkId: linkType === "none" ? undefined : linkId,
    });
    toast.success("Anotação criada");
    setTitle(""); setDescription(""); setPriority("medium"); setLinkType("none"); setLinkId(undefined);
    setOpen(false);
  };

  const campaigns = clients.flatMap((c) => c.campaigns.map((camp) => ({ id: camp.id, label: `${c.name} › ${camp.name}` })));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-1.5" /> Nova anotação
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle>Nova anotação no calendário</DialogTitle>
          <DialogDescription>Registre mudanças, prazos e lembretes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Trocar criativo principal Belle" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data / Prazo</Label>
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
            <div className="space-y-2">
              <Label>Prioridade</Label>
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
            <div className="space-y-2">
              <Label>Vincular a</Label>
              <Select value={linkType} onValueChange={(v) => { setLinkType(v as CalendarLinkType); setLinkId(undefined); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="campaign">Campanha</SelectItem>
                  <SelectItem value="audience">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {linkType !== "none" && (
              <div className="space-y-2">
                <Label>Selecione</Label>
                <Select value={linkId} onValueChange={setLinkId}>
                  <SelectTrigger><SelectValue placeholder="Escolher…" /></SelectTrigger>
                  <SelectContent>
                    {linkType === "client" && clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {linkType === "campaign" && campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    {linkType === "audience" && audiences.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalhes, contexto, métricas a observar..." />
          </div>
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
  const { calendarNotes, toggleCalendarNote, deleteCalendarNote, clients, audiences } = useAppData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  const today = startOfDay(new Date());
  const in7 = addDays(today, 7);

  const noteDates = useMemo(
    () => calendarNotes.filter((n) => !n.done).map((n) => parseISO(n.date)),
    [calendarNotes],
  );

  const notesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return calendarNotes.filter((n) => isSameDay(parseISO(n.date), selectedDate));
  }, [calendarNotes, selectedDate]);

  const upcoming = useMemo(
    () =>
      [...calendarNotes]
        .filter((n) => !n.done)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [calendarNotes],
  );

  const overdue = upcoming.filter((n) => isBefore(parseISO(n.date), today));
  const next7 = upcoming.filter((n) => {
    const d = parseISO(n.date);
    return !isBefore(d, today) && isBefore(d, addDays(in7, 1));
  });

  const linkLabel = (n: typeof calendarNotes[number]) => {
    if (n.linkType === "client") return clients.find((c) => c.id === n.linkId)?.name;
    if (n.linkType === "audience") return audiences.find((a) => a.id === n.linkId)?.name;
    if (n.linkType === "campaign") {
      for (const c of clients) {
        const camp = c.campaigns.find((cc) => cc.id === n.linkId);
        if (camp) return `${c.name} › ${camp.name}`;
      }
    }
    return null;
  };

  const goToLink = (n: typeof calendarNotes[number]) => {
    if (n.linkType === "client") navigate(`/clients?focus=${n.linkId}`);
    else if (n.linkType === "campaign") navigate(`/clients?focus=${n.linkId}`);
    else if (n.linkType === "audience") navigate(`/clients`);
  };

  const NoteCard = ({ n }: { n: typeof calendarNotes[number] }) => {
    const link = linkLabel(n);
    const isOverdue = !n.done && isBefore(parseISO(n.date), today);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-lg border p-3 flex items-start gap-3 transition-colors",
          n.done ? "bg-secondary/20 border-border opacity-60" : "bg-secondary/30 border-border hover:border-cobalt/40",
        )}
      >
        <button onClick={() => toggleCalendarNote(n.id)} className="mt-0.5 shrink-0">
          {n.done ? (
            <CheckCircle2 className="w-4 h-4 text-health-green" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("text-sm font-medium text-foreground", n.done && "line-through")}>{n.title}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", priorityStyles[n.priority])}>
              {priorityLabel[n.priority]}
            </span>
            {isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Atrasado
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(parseISO(n.date), "dd 'de' MMM yyyy", { locale: ptBR })}
            </span>
            {link && (
              <button onClick={() => goToLink(n)} className="flex items-center gap-1 text-cobalt hover:underline">
                <Link2 className="w-3 h-3" /> {link}
              </button>
            )}
          </div>
          {n.description && <p className="text-xs text-muted-foreground mt-1.5">{n.description}</p>}
        </div>
        <button
          onClick={() => { deleteCalendarNote(n.id); toast.success("Anotação removida"); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anote mudanças, prazos e lembretes — vincule a clientes, campanhas ou públicos.
          </p>
        </div>
        <NewNoteDialog defaultDate={selectedDate} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              modifiers={{ hasNote: noteDates }}
              modifiersClassNames={{ hasNote: "relative font-semibold text-cobalt after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-cobalt" }}
              className={cn("p-0 pointer-events-auto")}
            />
          </div>

          <div className="glass-card p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Resumo</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Atrasadas</span>
              <span className="font-semibold text-destructive">{overdue.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Próximos 7 dias</span>
              <span className="font-semibold text-cobalt">{next7.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Concluídas</span>
              <span className="font-semibold text-health-green">{calendarNotes.filter((n) => n.done).length}</span>
            </div>
          </div>
        </div>

        {/* Lists */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDate && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-cobalt" />
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <div className="space-y-2">
                {notesForSelected.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                    Nenhuma anotação para este dia.
                  </p>
                ) : (
                  notesForSelected.map((n) => <NoteCard key={n.id} n={n} />)
                )}
              </div>
            </section>
          )}

          {overdue.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Atrasadas
              </h2>
              <div className="space-y-2">
                {overdue.map((n) => <NoteCard key={n.id} n={n} />)}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Próximos 7 dias</h2>
            <div className="space-y-2">
              {next7.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                  Nada agendado para os próximos 7 dias.
                </p>
              ) : (
                next7.map((n) => <NoteCard key={n.id} n={n} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
