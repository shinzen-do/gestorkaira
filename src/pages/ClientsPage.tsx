import { motion } from "framer-motion";
import { ClientTree } from "@/components/ClientTree";
import { clients } from "@/data/mockData";
import { HealthBadge } from "@/components/HealthBadge";

export default function ClientsPage() {
  const stats = {
    total: clients.length,
    green: clients.filter((c) => c.health === "green").length,
    yellow: clients.filter((c) => c.health === "yellow").length,
    red: clients.filter((c) => c.health === "red").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a hierarquia completa: Cliente → Campanha → CA</p>
      </motion.div>

      <div className="flex gap-4">
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

      <div className="space-y-3">
        {clients.map((client) => (
          <ClientTree key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
