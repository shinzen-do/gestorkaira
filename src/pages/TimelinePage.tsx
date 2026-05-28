import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { History, ArrowUp, ArrowDown, Minus, Download, FileText, Filter } from "lucide-react";
import { useAppData, type TimelineEntry, type TargetType } from "@/contexts/AppDataContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeletons";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<TimelineEntry["type"], string> = {
  creative: "Criativo", budget: "Orçamento", audience: "Público",
  bid: "Lance", status: "Status", note: "Nota",
};

const targetLabels: Record<TargetType, string> = {
  client: "Cliente", campaign: "Campanha", adset: "Conjunto",
  audience: "Público", creative: "Criativo",
};

type EnrichedEntry = TimelineEntry & { context: string; clientName: string; campaignName: string; adSetName: string };

export default function TimelinePage() {
  useDocumentTitle("Timeline");
  const { timelineEntries, clients, campaigns, adSets, audiences, loading } = useAppData();
  const { toast } = useToast();

  // Filtros
  const [targetType, setTargetType] = useState<"all" | TargetType>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [adSetId, setAdSetId] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const enriched = useMemo<EnrichedEntry[]>(() => {
    return timelineEntries.map((t) => {
      let context = "";
      let clientName = "";
      let campaignName = "";
      let adSetName = "";
      if (t.target_type === "client") {
        const cl = clients.find((c) => c.id === t.target_id);
        clientName = cl?.name ?? "";
        context = clientName || "Cliente";
      } else if (t.target_type === "campaign") {
        const c = campaigns.find((x) => x.id === t.target_id);
        const cl = c ? clients.find((x) => x.id === c.client_id) : null;
        clientName = cl?.name ?? "";
        campaignName = c?.name ?? "";
        context = `${clientName} › ${campaignName || "Campanha"}`;
      } else if (t.target_type === "adset") {
        const a = adSets.find((x) => x.id === t.target_id);
        const c = a ? campaigns.find((x) => x.id === a.campaign_id) : null;
        const cl = c ? clients.find((x) => x.id === c.client_id) : null;
        clientName = cl?.name ?? "";
        campaignName = c?.name ?? "";
        adSetName = a?.name ?? "";
        context = `${clientName} › ${campaignName} › ${adSetName || "Conjunto"}`;
      } else if (t.target_type === "audience") {
        context = `Público · ${audiences.find((a) => a.id === t.target_id)?.name ?? ""}`;
      }
      return { ...t, context, clientName, campaignName, adSetName };
    });
  }, [timelineEntries, clients, campaigns, adSets, audiences]);

  // Aplica filtros
  const filtered = useMemo(() => {
    return enriched.filter((e) => {
      if (targetType !== "all" && e.target_type !== targetType) return false;

      // Filtro por cliente — abrange entradas relacionadas (cliente, suas campanhas, seus conjuntos)
      if (clientId !== "all") {
        if (e.target_type === "client" && e.target_id !== clientId) return false;
        if (e.target_type === "campaign") {
          const c = campaigns.find((x) => x.id === e.target_id);
          if (!c || c.client_id !== clientId) return false;
        }
        if (e.target_type === "adset") {
          const a = adSets.find((x) => x.id === e.target_id);
          const c = a ? campaigns.find((x) => x.id === a.campaign_id) : null;
          if (!c || c.client_id !== clientId) return false;
        }
        if (e.target_type === "audience" || e.target_type === "creative") return false;
      }

      if (campaignId !== "all") {
        if (e.target_type === "campaign" && e.target_id !== campaignId) return false;
        if (e.target_type === "adset") {
          const a = adSets.find((x) => x.id === e.target_id);
          if (!a || a.campaign_id !== campaignId) return false;
        }
        if (e.target_type !== "campaign" && e.target_type !== "adset") return false;
      }

      if (adSetId !== "all") {
        if (e.target_type !== "adset" || e.target_id !== adSetId) return false;
      }

      if (from || to) {
        const d = parseISO(e.occurred_at);
        const start = from ? startOfDay(parseISO(from)) : new Date(-8640000000000000);
        const end = to ? endOfDay(parseISO(to)) : new Date(8640000000000000);
        if (!isWithinInterval(d, { start, end })) return false;
      }

      return true;
    });
  }, [enriched, targetType, clientId, campaignId, adSetId, from, to, campaigns, adSets]);

  // Campanhas/conjuntos disponíveis com base no cliente selecionado
  const availableCampaigns = useMemo(
    () => (clientId === "all" ? campaigns : campaigns.filter((c) => c.client_id === clientId)),
    [campaigns, clientId],
  );
  const availableAdSets = useMemo(() => {
    let base = adSets;
    if (campaignId !== "all") base = base.filter((a) => a.campaign_id === campaignId);
    else if (clientId !== "all") {
      const cIds = new Set(availableCampaigns.map((c) => c.id));
      base = base.filter((a) => cIds.has(a.campaign_id));
    }
    return base;
  }, [adSets, campaignId, clientId, availableCampaigns]);

  const clearFilters = () => {
    setTargetType("all"); setClientId("all"); setCampaignId("all"); setAdSetId("all");
    setFrom(""); setTo("");
  };

  // ---------- Exportações ----------
  const buildFilename = (ext: string) => {
    const parts = ["historico"];
    if (clientId !== "all") parts.push(clients.find((c) => c.id === clientId)?.name?.replace(/\s+/g, "-").toLowerCase() ?? "cliente");
    if (campaignId !== "all") parts.push(campaigns.find((c) => c.id === campaignId)?.name?.replace(/\s+/g, "-").toLowerCase() ?? "campanha");
    if (adSetId !== "all") parts.push(adSets.find((a) => a.id === adSetId)?.name?.replace(/\s+/g, "-").toLowerCase() ?? "conjunto");
    parts.push(format(new Date(), "yyyy-MM-dd"));
    return `${parts.join("_")}.${ext}`;
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast({ title: "Nada para exportar", description: "Ajuste os filtros e tente novamente.", variant: "destructive" });
      return;
    }
    const headers = ["Data", "Hora", "Tipo", "Alvo", "Cliente", "Campanha", "Conjunto", "Descrição", "Detalhes", "Impacto"];
    const rows = filtered.map((e) => {
      const d = parseISO(e.occurred_at);
      return [
        format(d, "yyyy-MM-dd"),
        format(d, "HH:mm"),
        typeLabels[e.type],
        targetLabels[e.target_type],
        e.clientName,
        e.campaignName,
        e.adSetName,
        e.description,
        e.details ?? "",
        e.impact === "positive" ? "Positivo" : e.impact === "negative" ? "Negativo" : "Neutro",
      ];
    });
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = buildFilename("csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado", description: `${filtered.length} registro(s).` });
  };

  const exportPDF = async () => {
    if (filtered.length === 0) {
      toast({ title: "Nada para exportar", description: "Ajuste os filtros e tente novamente.", variant: "destructive" });
      return;
    }
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Header
    doc.setFontSize(16);
    doc.text("Histórico — Kaira", 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(120);

    const filterDesc: string[] = [];
    if (clientId !== "all") filterDesc.push(`Cliente: ${clients.find((c) => c.id === clientId)?.name ?? ""}`);
    if (campaignId !== "all") filterDesc.push(`Campanha: ${campaigns.find((c) => c.id === campaignId)?.name ?? ""}`);
    if (adSetId !== "all") filterDesc.push(`Conjunto: ${adSets.find((a) => a.id === adSetId)?.name ?? ""}`);
    if (targetType !== "all") filterDesc.push(`Tipo de alvo: ${targetLabels[targetType as TargetType]}`);
    if (from) filterDesc.push(`De: ${format(parseISO(from), "dd/MM/yyyy")}`);
    if (to) filterDesc.push(`Até: ${format(parseISO(to), "dd/MM/yyyy")}`);
    if (filterDesc.length === 0) filterDesc.push("Sem filtros (todos os registros)");

    doc.text(filterDesc.join("  ·  "), 40, 58);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}  ·  ${filtered.length} registro(s)`, 40, 72);

    autoTable(doc, {
      startY: 90,
      head: [["Data/Hora", "Tipo", "Alvo", "Contexto", "Descrição", "Impacto"]],
      body: filtered.map((e) => [
        format(parseISO(e.occurred_at), "dd/MM/yy HH:mm"),
        typeLabels[e.type],
        targetLabels[e.target_type],
        e.context,
        e.details ? `${e.description}\n${e.details}` : e.description,
        e.impact === "positive" ? "Positivo" : e.impact === "negative" ? "Negativo" : "Neutro",
      ]),
      styles: { fontSize: 9, cellPadding: 6, valign: "top" },
      headStyles: { fillColor: [199, 161, 78], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 246, 240] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 65 },
        2: { cellWidth: 65 },
        3: { cellWidth: 180 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 60 },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(buildFilename("pdf"));
    toast({ title: "PDF exportado", description: `${filtered.length} registro(s).` });
  };

  const activeFilters = [targetType !== "all", clientId !== "all", campaignId !== "all", adSetId !== "all", !!from, !!to].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Todas as mudanças registradas em clientes, campanhas, conjuntos e públicos.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCSV}>
              <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-2" /> PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filtros
            {activeFilters > 0 && (
              <span className="text-[10px] bg-gold/15 text-gold px-1.5 py-0.5 rounded">
                {activeFilters} ativo{activeFilters > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">Limpar</Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Tipo de alvo</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as typeof targetType)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="campaign">Campanha</SelectItem>
                <SelectItem value="adset">Conjunto</SelectItem>
                <SelectItem value="audience">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Cliente</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setCampaignId("all"); setAdSetId("all"); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Campanha</Label>
            <Select value={campaignId} onValueChange={(v) => { setCampaignId(v); setAdSetId("all"); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableCampaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Conjunto</Label>
            <Select value={adSetId} onValueChange={setAdSetId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableAdSets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Mostrando <span className="text-foreground font-medium">{filtered.length}</span> de {enriched.length} registro(s).
        </p>
      </div>

      {loading && enriched.length === 0 ? (
        <ListSkeleton count={5} />
      ) : enriched.length === 0 ? (
        <EmptyState icon={History} title="Sem registros"
          description="Use o ícone de histórico em qualquer cliente, campanha ou conjunto para registrar mudanças." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="Nenhum registro com esses filtros"
          description="Ajuste ou limpe os filtros para ver mais resultados." />
      ) : (
        <div className="space-y-2">
          {filtered.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="glass-card p-4 flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                e.impact === "positive" ? "bg-health-green/15 text-health-green" :
                e.impact === "negative" ? "bg-destructive/15 text-destructive" :
                "bg-muted text-muted-foreground")}>
                {e.impact === "positive" ? <ArrowUp className="w-4 h-4" /> : e.impact === "negative" ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">{typeLabels[e.type]}</span>
                  <span className="text-[11px] text-muted-foreground">{e.context}</span>
                </div>
                <p className="text-sm text-foreground mt-1">{e.description}</p>
                {e.details && <p className="text-xs text-muted-foreground mt-1">{e.details}</p>}
                <p className="text-[10px] text-muted-foreground mt-1.5">{format(parseISO(e.occurred_at), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
