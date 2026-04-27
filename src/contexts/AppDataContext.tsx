import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { clients as initialClients, audiences as initialAudiences, type Client, type Audience, type TimelineEntry } from "@/data/mockData";

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

interface AppDataContextValue {
  clients: Client[];
  audiences: Audience[];
  audienceTimelines: Record<string, TimelineEntry[]>;
  addTimelineEntry: (args: AddTimelineArgs) => void;
  toggleAudience: (id: string) => void;
  search: (q: string) => SearchHit[];
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [audiences, setAudiences] = useState<Audience[]>(initialAudiences);
  const [audienceTimelines, setAudienceTimelines] = useState<Record<string, TimelineEntry[]>>({});

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
    () => ({ clients, audiences, audienceTimelines, addTimelineEntry, toggleAudience, search }),
    [clients, audiences, audienceTimelines],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export type { SearchHit };
