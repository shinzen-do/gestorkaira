import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// Types (espelham as tabelas)
// ============================================================
export type Status = "active" | "paused" | "archived";
export type CreativeFormat = "image" | "video" | "carousel";
export type Gender = "all" | "male" | "female";
export type Impact = "positive" | "negative" | "neutral";
export type TimelineType = "creative" | "budget" | "audience" | "bid" | "status" | "note";
export type TargetType = "client" | "campaign" | "adset" | "audience" | "creative";
export type BudgetType = "daily" | "total";

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  monthly_budget: number;
  status: Status;
  notes: string | null;
  created_at: string;
}

export type BudgetStrategy = "cbo" | "abo";

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  objective: string | null;
  status: Status;
  budget: number;
  budget_type: BudgetType;
  budget_strategy: BudgetStrategy;
  spend: number;
  roas: number;
  created_at: string;
}

export interface AdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: Status;
  budget: number;
  budget_type: BudgetType;
  created_at: string;
}

export interface Creative {
  id: string;
  ad_set_id: string;
  name: string;
  format: CreativeFormat;
  status: Status;
  url: string | null;
  results: number;
  result_label: string;
  cost_per_result: number;
  // legados (mantidos para compat de leitura)
  ctr: number;
  impressions: number;
  created_at: string;
}

export interface Audience {
  id: string;
  name: string;
  description: string | null;
  gender: Gender;
  age_min: number;
  age_max: number;
  interests: string[];
  status: Status;
  size_estimate: number | null;
  created_at: string;
}

export interface AudienceCampaign {
  id: string;
  audience_id: string;
  campaign_id: string;
}

export interface ValidatedCreative {
  id: string;
  client_id: string;
  name: string;
  format: CreativeFormat;
  url: string | null;
  ctr: number | null;
  roas: number | null;
  tags: string[];
  validated_at: string;
}

export interface TimelineEntry {
  id: string;
  target_type: TargetType;
  target_id: string;
  type: TimelineType;
  description: string;
  details: string | null;
  impact: Impact;
  occurred_at: string;
}

export type PlannedStatus = "planned" | "active" | "cancelled";

export interface PlannedCampaign {
  id: string;
  client_id: string;
  name: string;
  objective: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  budget_type: BudgetType;
  daily_amount: number;
  total_amount: number;
  status: PlannedStatus;
  notes: string | null;
  created_at: string;
}

export type CalendarPriority = "low" | "medium" | "high";
export type CalendarLinkType = "none" | "client" | "campaign" | "audience";

export interface CalendarNote {
  id: string;
  title: string;
  description: string | null;
  date: string;
  priority: CalendarPriority;
  done: boolean;
  link_type: CalendarLinkType;
  link_id: string | null;
}

export interface SearchHit {
  type: TargetType;
  id: string;
  label: string;
  context: string;
}

interface Ctx {
  loading: boolean;
  clients: Client[];
  campaigns: Campaign[];
  adSets: AdSet[];
  creatives: Creative[];
  audiences: Audience[];
  audienceCampaigns: AudienceCampaign[];
  validatedCreatives: ValidatedCreative[];
  timelineEntries: TimelineEntry[];
  calendarNotes: CalendarNote[];
  plannedCampaigns: PlannedCampaign[];

  // Clients
  createClient: (input: { name: string; industry?: string; monthly_budget?: number; notes?: string }) => Promise<Client | null>;
  updateClient: (id: string, patch: Partial<Pick<Client, "name" | "industry" | "monthly_budget" | "status" | "notes">>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Campaigns
  createCampaign: (input: { client_id: string; name: string; objective?: string; budget?: number; budget_type?: BudgetType; budget_strategy?: BudgetStrategy }) => Promise<Campaign | null>;
  updateCampaign: (id: string, patch: Partial<Pick<Campaign, "name" | "objective" | "status" | "budget" | "budget_type" | "budget_strategy" | "spend" | "roas">>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // AdSets
  createAdSet: (input: { campaign_id: string; name: string; budget?: number; budget_type?: BudgetType }) => Promise<AdSet | null>;
  updateAdSet: (id: string, patch: Partial<Pick<AdSet, "name" | "status" | "budget" | "budget_type">>) => Promise<void>;
  deleteAdSet: (id: string) => Promise<void>;

  // Creatives
  createCreative: (input: { ad_set_id: string; name: string; format?: CreativeFormat; url?: string; result_label?: string }) => Promise<Creative | null>;
  updateCreative: (id: string, patch: Partial<Pick<Creative, "name" | "format" | "status" | "url" | "results" | "result_label" | "cost_per_result" | "ctr" | "impressions">>) => Promise<void>;
  deleteCreative: (id: string) => Promise<void>;

  // Audiences
  createAudience: (input: Omit<Audience, "id" | "created_at" | "size_estimate"> & { size_estimate?: number; campaignIds?: string[] }) => Promise<Audience | null>;
  updateAudience: (id: string, patch: Partial<Omit<Audience, "id" | "created_at">>) => Promise<void>;
  deleteAudience: (id: string) => Promise<void>;
  toggleAudience: (id: string) => Promise<void>;
  linkAudienceToCampaigns: (audienceId: string, campaignIds: string[]) => Promise<void>;

  // Validated creatives
  createValidatedCreative: (input: Omit<ValidatedCreative, "id" | "validated_at"> & { validated_at?: string }) => Promise<void>;
  deleteValidatedCreative: (id: string) => Promise<void>;

  // Timeline
  addTimelineEntry: (input: Omit<TimelineEntry, "id" | "occurred_at"> & { occurred_at?: string }) => Promise<void>;

  // Calendar
  addCalendarNote: (input: Omit<CalendarNote, "id" | "done">) => Promise<void>;
  updateCalendarNote: (id: string, patch: Partial<Omit<CalendarNote, "id">>) => Promise<void>;
  toggleCalendarNote: (id: string) => Promise<void>;
  deleteCalendarNote: (id: string) => Promise<void>;

  // Planned campaigns
  createPlannedCampaign: (input: Omit<PlannedCampaign, "id" | "created_at">) => Promise<PlannedCampaign | null>;
  updatePlannedCampaign: (id: string, patch: Partial<Omit<PlannedCampaign, "id" | "created_at">>) => Promise<void>;
  deletePlannedCampaign: (id: string) => Promise<void>;

  // Helpers
  search: (q: string) => SearchHit[];
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audienceCampaigns, setAudienceCampaigns] = useState<AudienceCampaign[]>([]);
  const [validatedCreatives, setValidatedCreatives] = useState<ValidatedCreative[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [plannedCampaigns, setPlannedCampaigns] = useState<PlannedCampaign[]>([]);
  const fetchSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    if (!user) {
      setClients([]); setCampaigns([]); setAdSets([]); setCreatives([]);
      setAudiences([]); setAudienceCampaigns([]); setValidatedCreatives([]);
      setTimelineEntries([]); setCalendarNotes([]); setPlannedCampaigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, cp, as, cr, au, ac, vc, te, cn, pc] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("ad_sets").select("*").order("created_at", { ascending: false }).limit(5000),
      supabase.from("creatives").select("*").order("created_at", { ascending: false }).limit(10000),
      supabase.from("audiences").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("audience_campaigns").select("*").limit(5000),
      supabase.from("validated_creatives").select("*").order("validated_at", { ascending: false }).limit(200),
      supabase.from("timeline_entries").select("*").order("occurred_at", { ascending: false }).order("created_at", { ascending: false }).limit(300),
      supabase.from("calendar_notes").select("*").order("date", { ascending: true }).limit(1000),
      supabase.from("planned_campaigns").select("*").order("start_date", { ascending: true }).limit(500),
    ]);
    // Descarta resultado de refresh anterior se outro foi disparado no meio (evita race quando user troca rápido).
    if (seq !== fetchSeqRef.current) return;
    setClients((c.data ?? []) as Client[]);
    setCampaigns((cp.data ?? []) as Campaign[]);
    setAdSets((as.data ?? []) as AdSet[]);
    setCreatives((cr.data ?? []) as Creative[]);
    setAudiences((au.data ?? []) as Audience[]);
    setAudienceCampaigns((ac.data ?? []) as AudienceCampaign[]);
    setValidatedCreatives((vc.data ?? []) as ValidatedCreative[]);
    setTimelineEntries((te.data ?? []) as TimelineEntry[]);
    setCalendarNotes((cn.data ?? []) as CalendarNote[]);
    setPlannedCampaigns((pc.data ?? []) as PlannedCampaign[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // ---------- helpers ----------
  const uid = () => user!.id;
  const need = () => { if (!user) throw new Error("not authenticated"); };

  // ---------- Clients ----------
  const createClient: Ctx["createClient"] = async (input) => {
    need();
    const { data, error } = await supabase.from("clients").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setClients((p) => [data as Client, ...p]);
    return data as Client;
  };
  const updateClient: Ctx["updateClient"] = async (id, patch) => {
    const { error } = await supabase.from("clients").update(patch).eq("id", id);
    if (error) throw error;
    setClients((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as Client : c)));
  };
  const deleteClient: Ctx["deleteClient"] = async (id) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    setClients((p) => p.filter((c) => c.id !== id));
    setCampaigns((p) => p.filter((c) => c.client_id !== id));
  };

  // ---------- Campaigns ----------
  const createCampaign: Ctx["createCampaign"] = async (input) => {
    need();
    const { data, error } = await supabase.from("campaigns").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setCampaigns((p) => [data as Campaign, ...p]);
    return data as Campaign;
  };
  const updateCampaign: Ctx["updateCampaign"] = async (id, patch) => {
    const { error } = await supabase.from("campaigns").update(patch).eq("id", id);
    if (error) throw error;
    setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as Campaign : c)));
  };
  const deleteCampaign: Ctx["deleteCampaign"] = async (id) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;
    setCampaigns((p) => p.filter((c) => c.id !== id));
  };

  // ---------- AdSets ----------
  const createAdSet: Ctx["createAdSet"] = async (input) => {
    need();
    const { data, error } = await supabase.from("ad_sets").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setAdSets((p) => [data as AdSet, ...p]);
    return data as AdSet;
  };
  const updateAdSet: Ctx["updateAdSet"] = async (id, patch) => {
    const { error } = await supabase.from("ad_sets").update(patch).eq("id", id);
    if (error) throw error;
    setAdSets((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as AdSet : c)));
  };
  const deleteAdSet: Ctx["deleteAdSet"] = async (id) => {
    const { error } = await supabase.from("ad_sets").delete().eq("id", id);
    if (error) throw error;
    setAdSets((p) => p.filter((c) => c.id !== id));
  };

  // ---------- Creatives ----------
  const createCreative: Ctx["createCreative"] = async (input) => {
    need();
    const { data, error } = await supabase.from("creatives").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setCreatives((p) => [data as Creative, ...p]);
    return data as Creative;
  };
  const updateCreative: Ctx["updateCreative"] = async (id, patch) => {
    const { error } = await supabase.from("creatives").update(patch).eq("id", id);
    if (error) throw error;
    setCreatives((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as Creative : c)));
  };
  const deleteCreative: Ctx["deleteCreative"] = async (id) => {
    const { error } = await supabase.from("creatives").delete().eq("id", id);
    if (error) throw error;
    setCreatives((p) => p.filter((c) => c.id !== id));
  };

  // ---------- Audiences ----------
  const createAudience: Ctx["createAudience"] = async (input) => {
    need();
    const { campaignIds, ...rest } = input;
    const { data, error } = await supabase.from("audiences").insert({ ...rest, user_id: uid() }).select().single();
    if (error) throw error;
    const created = data as Audience;
    setAudiences((p) => [created, ...p]);
    if (campaignIds && campaignIds.length > 0) {
      await linkAudienceToCampaigns(created.id, campaignIds);
    }
    return created;
  };
  const updateAudience: Ctx["updateAudience"] = async (id, patch) => {
    const { error } = await supabase.from("audiences").update(patch).eq("id", id);
    if (error) throw error;
    setAudiences((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as Audience : c)));
  };
  const deleteAudience: Ctx["deleteAudience"] = async (id) => {
    const { error } = await supabase.from("audiences").delete().eq("id", id);
    if (error) throw error;
    setAudiences((p) => p.filter((c) => c.id !== id));
    setAudienceCampaigns((p) => p.filter((ac) => ac.audience_id !== id));
  };
  const toggleAudience: Ctx["toggleAudience"] = async (id) => {
    const a = audiences.find((x) => x.id === id);
    if (!a) return;
    await updateAudience(id, { status: a.status === "active" ? "paused" : "active" });
  };
  const linkAudienceToCampaigns: Ctx["linkAudienceToCampaigns"] = async (audienceId, campaignIds) => {
    need();
    // Remove existing
    await supabase.from("audience_campaigns").delete().eq("audience_id", audienceId);
    if (campaignIds.length > 0) {
      const rows = campaignIds.map((cid) => ({ audience_id: audienceId, campaign_id: cid, user_id: uid() }));
      const { data, error } = await supabase.from("audience_campaigns").insert(rows).select();
      if (error) throw error;
      setAudienceCampaigns((p) => [...p.filter((ac) => ac.audience_id !== audienceId), ...((data ?? []) as AudienceCampaign[])]);
    } else {
      setAudienceCampaigns((p) => p.filter((ac) => ac.audience_id !== audienceId));
    }
  };

  // ---------- Validated creatives ----------
  const createValidatedCreative: Ctx["createValidatedCreative"] = async (input) => {
    need();
    const { error, data } = await supabase.from("validated_creatives").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setValidatedCreatives((p) => [data as ValidatedCreative, ...p]);
  };
  const deleteValidatedCreative: Ctx["deleteValidatedCreative"] = async (id) => {
    const { error } = await supabase.from("validated_creatives").delete().eq("id", id);
    if (error) throw error;
    setValidatedCreatives((p) => p.filter((c) => c.id !== id));
  };

  // ---------- Timeline ----------
  const addTimelineEntry: Ctx["addTimelineEntry"] = async (input) => {
    need();
    const { error, data } = await supabase.from("timeline_entries").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setTimelineEntries((p) => [data as TimelineEntry, ...p]);
  };

  // ---------- Calendar ----------
  const addCalendarNote: Ctx["addCalendarNote"] = async (input) => {
    need();
    const { error, data } = await supabase.from("calendar_notes").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setCalendarNotes((p) => [data as CalendarNote, ...p]);
  };
  const updateCalendarNote: Ctx["updateCalendarNote"] = async (id, patch) => {
    const { error } = await supabase.from("calendar_notes").update(patch).eq("id", id);
    if (error) throw error;
    setCalendarNotes((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as CalendarNote : c)));
  };
  const toggleCalendarNote: Ctx["toggleCalendarNote"] = async (id) => {
    const n = calendarNotes.find((x) => x.id === id);
    if (!n) return;
    await updateCalendarNote(id, { done: !n.done });
  };
  const deleteCalendarNote: Ctx["deleteCalendarNote"] = async (id) => {
    const { error } = await supabase.from("calendar_notes").delete().eq("id", id);
    if (error) throw error;
    setCalendarNotes((p) => p.filter((c) => c.id !== id));
  };

  // ---------- Planned campaigns ----------
  const createPlannedCampaign: Ctx["createPlannedCampaign"] = async (input) => {
    need();
    const { error, data } = await supabase.from("planned_campaigns").insert({ ...input, user_id: uid() }).select().single();
    if (error) throw error;
    setPlannedCampaigns((p) => [...p, data as PlannedCampaign]);
    return data as PlannedCampaign;
  };
  const updatePlannedCampaign: Ctx["updatePlannedCampaign"] = async (id, patch) => {
    const { error } = await supabase.from("planned_campaigns").update(patch).eq("id", id);
    if (error) throw error;
    setPlannedCampaigns((p) => p.map((c) => (c.id === id ? { ...c, ...patch } as PlannedCampaign : c)));
  };
  const deletePlannedCampaign: Ctx["deletePlannedCampaign"] = async (id) => {
    const { error } = await supabase.from("planned_campaigns").delete().eq("id", id);
    if (error) throw error;
    setPlannedCampaigns((p) => p.filter((c) => c.id !== id));
  };
  const search: Ctx["search"] = (q) => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hits: SearchHit[] = [];
    clients.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) {
        hits.push({ type: "client", id: c.id, label: c.name, context: c.industry ?? "Cliente" });
      }
    });
    campaigns.forEach((cp) => {
      if (cp.name.toLowerCase().includes(term)) {
        const cl = clients.find((c) => c.id === cp.client_id);
        hits.push({ type: "campaign", id: cp.id, label: cp.name, context: cl?.name ?? "Campanha" });
      }
    });
    audiences.forEach((a) => {
      if (a.name.toLowerCase().includes(term) || a.interests.some((i) => i.toLowerCase().includes(term))) {
        hits.push({ type: "audience", id: a.id, label: a.name, context: `Público · ${a.interests.slice(0, 2).join(", ")}` });
      }
    });
    return hits.slice(0, 12);
  };

  const value = useMemo<Ctx>(
    () => ({
      loading, clients, campaigns, adSets, creatives, audiences, audienceCampaigns,
      validatedCreatives, timelineEntries, calendarNotes, plannedCampaigns,
      createClient, updateClient, deleteClient,
      createCampaign, updateCampaign, deleteCampaign,
      createAdSet, updateAdSet, deleteAdSet,
      createCreative, updateCreative, deleteCreative,
      createAudience, updateAudience, deleteAudience, toggleAudience, linkAudienceToCampaigns,
      createValidatedCreative, deleteValidatedCreative,
      addTimelineEntry,
      addCalendarNote, updateCalendarNote, toggleCalendarNote, deleteCalendarNote,
      createPlannedCampaign, updatePlannedCampaign, deletePlannedCampaign,
      search, refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, clients, campaigns, adSets, creatives, audiences, audienceCampaigns, validatedCreatives, timelineEntries, calendarNotes, plannedCampaigns],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
