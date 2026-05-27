import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Megaphone, Layers, Target } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppData } from "@/contexts/AppDataContext";

const iconFor = {
  client: Users,
  campaign: Megaphone,
  adset: Layers,
  audience: Target,
} as const;

const labelFor = {
  client: "Cliente",
  campaign: "Campanha",
  adset: "Conjunto",
  audience: "Público",
} as const;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { search } = useAppData();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = search(query);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setQuery("");
    if (type === "audience") {
      navigate(`/audiences?focus=${id}`);
    } else {
      navigate(`/clients?focus=${id}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors sm:min-w-[260px]"
        aria-label="Buscar"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left hidden sm:inline">Buscar clientes, campanhas, públicos…</span>
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Digite para buscar…" />
        <CommandList>
          <CommandEmpty>{query ? "Nenhum resultado." : "Comece a digitar para buscar."}</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Resultados">
              {results.map((r) => {
                const Icon = iconFor[r.type];
                return (
                  <CommandItem
                    key={`${r.type}-${r.id}`}
                    value={`${r.type}-${r.id}-${r.label}`}
                    onSelect={() => handleSelect(r.type, r.id)}
                  >
                    <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.context}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{labelFor[r.type]}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
