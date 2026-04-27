import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { ClientTree } from "@/components/ClientTree";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/contexts/AppDataContext";
import { HealthBadge } from "@/components/HealthBadge";

export default function ClientsPage() {
  const { clients } = useAppData();
  const [params] = useSearchParams();
  const focusId = params.get("focus");
  const [query, setQuery] = useState("");

  const stats = {
    total: clients.length,
    green: clients.filter((c) => c.health === "green").length,
    yellow: clients.filter((c) => c.health === "yellow").length,
    red: clients.filter((c) => c.health === "red").length,
  };

  // Determine which clients should be expanded by default based on focus
  const expandedClientIds = useMemo(() => {
    if (!focusId) return new Set<string>();
    const ids = new Set<string>();
    clients.forEach((c) => {
      if (c.id === focusId) ids.add(c.id);
      c.campaigns.forEach((camp) => {
        if (camp.id === focusId) ids.add(c.id);
        camp.adSets.forEach((as) => {
          if (as.id === focusId) ids.add(c.id);
        });
      });
    });
    return ids;
  }, [focusId, clients]);

  useEffect(() => {
    if (focusId) {
      const t = setTimeout(() => {
        document.getElementById(`client-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [focusId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      if (c.name.toLowerCase().includes(term) || c.industry.toLowerCase().includes(term)) return true;
      return c.campaigns.some(
        (camp) =>
          camp.name.toLowerCase().includes(term) ||
          camp.adSets.some((as) => as.name.toLowerCase().includes(term)),
      );
    });
  }, [clients, query]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hierarquia completa: Cliente → Campanha → CA. Registre mudanças direto na árvore.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-lg font-semibold text-foreground">{stats.total}</span>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <HealthBadge status="green" />
          <span className="text-sm font-medium text-foreground">{stats.green}</span>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <HealthBadge status="yellow" />
          <span className="text-sm font-medium text-foreground">{stats.yellow}</span>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3">
          <HealthBadge status="red" />
          <span className="text-sm font-medium text-foreground">{stats.red}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente, campanha ou conjunto…"
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((client) => (
          <div key={client.id} id={`client-${client.id}`}>
            <ClientTree client={client} defaultExpanded={expandedClientIds.has(client.id)} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
