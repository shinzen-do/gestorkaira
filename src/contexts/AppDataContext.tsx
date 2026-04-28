import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import {
  clients as initialClients,
  audiences as initialAudiences,
  type Client,
  type Audience,
  type TimelineEntry,
  type ValidatedCreative,
} from "@/data/mockData";

type TargetType = "client" | "campaign" | "adset" | "audience";

interface AddTimelineArgs {
  targetType: "campaign" | "adset" | "audience";
  targetId: string;
  entry: Omit<TimelineEntry, "id" | "date"> & { date?: string };
}

interface SearchHit {
  type: TargetType;
  id: string;
  label: string;
  context: string;
}

export type CalendarPriority = "low" | "medium" | "high";
export type CalendarLinkType = "client" | "campaign" | "audience" | "none";

export interface CalendarNote {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO YYYY-MM-DD — when the change/task should happen or deadline
  priority: CalendarPriority;
  linkType: CalendarLinkType;
  linkId?: string;
  done: boolean;
  createdAt: string;
}

interface AddCalendarNoteArgs {
  title: string;
  description?: string;
  date: string;
  priority: CalendarPriority;
  linkType: CalendarLinkType;
  linkId?: string;
}

interface AppDataContextValue {
  clients: Client[];
  audiences: Audience[];
  audienceTimelines: Record<string, TimelineEntry[]>;
  addTimelineEntry: (args: AddTimelineArgs) => void;
  toggleAudience: (id: string) => void;
  search: (q: string) => SearchHit[];
  // Calendar
  calendarNotes: CalendarNote[];
  addCalendarNote: (n: AddCalendarNoteArgs) => void;
  toggleCalendarNote: (id: string) => void;
  deleteCalendarNote: (id: string) => void;
  // Validated creatives
  addValidatedCreative: (clientId: string, c: Omit<ValidatedCreative, "id" | "validatedAt"> & { validatedAt?: string }) => void;
  removeValidatedCreative: (clientId: string, creativeId: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [audiences, setAudiences] = useState<Audience[]>(initialAudiences);
  const [audienceTimelines, setAudienceTimelines] = useState<Record<string, TimelineEntry[]>>({});
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([
    {
      id: "cn-seed-1",
      title: "Revisar criativos da campanha Belle Vit. C",
      description: "Trocar criativos com CTR < 2% antes do fim de semana.",
      date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      priority: "high",
      linkType: "client",
      linkId: "c2",
      done: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cn-seed-2",
      title: "Subir orçamento — TechNova Lead Gen",
      description: "ROAS estável em 4.8x, escalar 30%.",
      date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      priority: "medium",
      linkType: "campaign",
      linkId: "camp1",
      done: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const addTimelineEntry = ({ targetType, targetId, entry }: AddTimelineArgs) => {
    const newEntry: TimelineEntry = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: entry.date ?? new Date().toISOString().slice(0, 10),
      type: entry.type,
      description: entry.description,
      details: entry.details,
      impact: entry.impact,
    };

    if (targetType === "audience") {
      setAudienceTimelines((prev) => ({
        ...prev,
        [targetId]: [newEntry, ...(prev[targetId] ?? [])],
      }));
      return;
    }

    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        campaigns: c.campaigns.map((camp) => {
          if (targetType === "campaign" && camp.id === targetId) {
            return { ...camp, timeline: [newEntry, ...camp.timeline] };
          }
          return {
            ...camp,
            adSets: camp.adSets.map((as) =>
              targetType === "adset" && as.id === targetId
                ? { ...as, timeline: [newEntry, ...as.timeline] }
                : as,
            ),
          };
        }),
      })),
    );
  };

  const toggleAudience = (id: string) => {
    setAudiences((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a)),
    );
  };

  const addCalendarNote = (n: AddCalendarNoteArgs) => {
    setCalendarNotes((prev) => [
      {
        id: `cn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...n,
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const toggleCalendarNote = (id: string) =>
    setCalendarNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));

  const deleteCalendarNote = (id: string) =>
    setCalendarNotes((prev) => prev.filter((n) => n.id !== id));

  const addValidatedCreative: AppDataContextValue["addValidatedCreative"] = (clientId, c) => {
    setClients((prev) =>
      prev.map((cl) =>
        cl.id === clientId
          ? {
              ...cl,
              validatedCreatives: [
                {
                  id: `vc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  validatedAt: c.validatedAt ?? new Date().toISOString().slice(0, 10),
                  ...c,
                },
                ...(cl.validatedCreatives ?? []),
              ],
            }
          : cl,
      ),
    );
  };

  const removeValidatedCreative = (clientId: string, creativeId: string) => {
    setClients((prev) =>
      prev.map((cl) =>
        cl.id === clientId
          ? { ...cl, validatedCreatives: (cl.validatedCreatives ?? []).filter((c) => c.id !== creativeId) }
          : cl,
      ),
    );
  };

  const search = (q: string): SearchHit[] => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hits: SearchHit[] = [];
    clients.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) {
        hits.push({ type: "client", id: c.id, label: c.name, context: c.industry });
      }
      c.campaigns.forEach((camp) => {
        if (camp.name.toLowerCase().includes(term)) {
          hits.push({ type: "campaign", id: camp.id, label: camp.name, context: c.name });
        }
        camp.adSets.forEach((as) => {
          if (as.name.toLowerCase().includes(term)) {
            hits.push({ type: "adset", id: as.id, label: as.name, context: `${c.name} › ${camp.name}` });
          }
        });
      });
    });
    audiences.forEach((a) => {
      if (
        a.name.toLowerCase().includes(term) ||
        a.interests.some((i) => i.toLowerCase().includes(term))
      ) {
        hits.push({ type: "audience", id: a.id, label: a.name, context: `Público · ${a.interests.slice(0, 2).join(", ")}` });
      }
    });
    return hits.slice(0, 12);
  };

  const value = useMemo(
    () => ({
      clients,
      audiences,
      audienceTimelines,
      addTimelineEntry,
      toggleAudience,
      search,
      calendarNotes,
      addCalendarNote,
      toggleCalendarNote,
      deleteCalendarNote,
      addValidatedCreative,
      removeValidatedCreative,
    }),
    [clients, audiences, audienceTimelines, calendarNotes],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export type { SearchHit };
