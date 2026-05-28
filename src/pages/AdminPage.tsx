import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign, Activity, Loader2, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const ADMIN_EMAILS = ["essenciamarketingegestao@gmail.com", "emanueldsouzamello@gmail.com"];

interface Metrics {
  total_users: number;
  users_24h: number;
  users_7d: number;
  users_30d: number;
  activated_with_clients: number;
  activated_with_campaigns: number;
  paid_intent: number;
  lifetime_intent: number;
  utm_breakdown: Array<{ source: string; count: number }>;
  plan_breakdown: Array<{ plan: string; count: number }>;
  recent_signups: Array<{ id: string; email: string; name: string | null; plan: string; utm_source: string | null; created_at: string }>;
  generated_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro_monthly: "Pro Mensal",
  pro_yearly: "Pro Anual",
  lifetime: "Vitalício",
};

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  pro_monthly: 47,
  pro_yearly: 470,
  lifetime: 497,
};

export default function AdminPage() {
  useDocumentTitle("Admin");
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: resp, error: rpcErr } = await supabase.rpc("admin_metrics");
    if (rpcErr) {
      setError(rpcErr.message);
    } else {
      setData(resp as unknown as Metrics);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/admin" replace />;

  if (!ADMIN_EMAILS.includes(user.email ?? "")) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center space-y-3 glass-card">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="font-display text-2xl">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">Essa área é só para administradores.</p>
          <Button asChild variant="outline" className="mt-2"><Link to="/dashboard">Voltar</Link></Button>
        </Card>
      </div>
    );
  }

  const mrrLowerBound = data
    ? (data.plan_breakdown ?? []).reduce((acc, p) => {
        if (p.plan === "pro_monthly") return acc + p.count * PLAN_PRICE.pro_monthly;
        if (p.plan === "pro_yearly") return acc + p.count * (PLAN_PRICE.pro_yearly / 12);
        return acc;
      }, 0)
    : 0;

  const lifetimeRevenuePotential = data
    ? (data.plan_breakdown.find((p) => p.plan === "lifetime")?.count ?? 0) * PLAN_PRICE.lifetime
    : 0;

  const activationRate = data && data.total_users > 0
    ? Math.round((data.activated_with_clients / data.total_users) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
              <Activity className="w-3.5 h-3.5" /> Admin
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-foreground mt-1">Kaira · Métricas internas</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {data ? `Atualizado ${format(parseISO(data.generated_at), "dd 'de' MMM, HH:mm:ss", { locale: ptBR })}` : "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Recarregar
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-2"><Link to="/dashboard"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link></Button>
          </div>
        </motion.div>

        {error && (
          <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
            Erro carregando métricas: {error}
          </Card>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Signups total" value={data.total_users.toString()} hint={`+${data.users_24h} nas últimas 24h`} icon={<Users className="w-4 h-4" />} />
              <StatCard label="Últimos 7 dias" value={data.users_7d.toString()} hint={`${data.users_30d} nos últimos 30d`} icon={<TrendingUp className="w-4 h-4" />} />
              <StatCard label="Ativação" value={`${activationRate}%`} hint={`${data.activated_with_clients} com 1+ cliente`} icon={<Activity className="w-4 h-4" />} />
              <StatCard label="MRR potencial" value={fmtBRL(mrrLowerBound)} hint={`+${fmtBRL(lifetimeRevenuePotential)} vitalícios`} icon={<DollarSign className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  Origem do tráfego <span className="text-[10px] text-muted-foreground font-normal">(UTM source)</span>
                </h2>
                <div className="space-y-2">
                  {data.utm_breakdown.map((row) => {
                    const pct = data.total_users > 0 ? Math.round((row.count / data.total_users) * 100) : 0;
                    return (
                      <div key={row.source} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{row.source || "(vazio)"}</p>
                          <div className="h-1 mt-1 rounded bg-secondary/40 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cobalt to-gold" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-3 shrink-0">
                          <span className="text-foreground font-mono">{row.count}</span> · {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="glass-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Plano declarado no signup</h2>
                <div className="space-y-2">
                  {data.plan_breakdown.map((row) => {
                    const pct = data.total_users > 0 ? Math.round((row.count / data.total_users) * 100) : 0;
                    const label = PLAN_LABELS[row.plan] ?? row.plan;
                    return (
                      <div key={row.plan} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{label}</p>
                          <div className="h-1 mt-1 rounded bg-secondary/40 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-gold to-cobalt" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-3 shrink-0">
                          <span className="text-foreground font-mono">{row.count}</span> · {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <Card className="glass-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Últimos signups</h2>
              {data.recent_signups.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sem signups ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.recent_signups.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-b-0 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{u.name || u.email}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {u.email} · {PLAN_LABELS[u.plan] ?? u.plan} {u.utm_source ? `· via ${u.utm_source}` : ""}
                        </p>
                      </div>
                      <div className="text-[11px] text-muted-foreground shrink-0">
                        {format(parseISO(u.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <Card className="glass-card p-4 space-y-1">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <p className="font-display text-2xl text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </Card>
  );
}

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
