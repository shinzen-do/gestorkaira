import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { dailyMetrics } from "@/data/mockData";
import { motion } from "framer-motion";
import { useState } from "react";

type Metric = "cpa" | "roas";

export function PerformanceChart() {
  const [metric, setMetric] = useState<Metric>("cpa");

  const avg = dailyMetrics.reduce((a, b) => a + b[metric], 0) / dailyMetrics.length;
  const today = dailyMetrics[dailyMetrics.length - 1][metric];
  const diff = ((today - avg) / avg) * 100;
  const isBetter = metric === "cpa" ? diff < 0 : diff > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Performance — 7 dias</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hoje vs média: <span className={isBetter ? "text-health-green" : "text-health-red"}>{isBetter ? "melhor" : "pior"} ({Math.abs(diff).toFixed(1)}%)</span>
          </p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(["cpa", "roas"] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${metric === m ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyMetrics}>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(0, 0%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(0, 0%, 50%)" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{
                background: "hsl(240, 4%, 9%)",
                border: "1px solid hsl(240, 4%, 14%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(0, 0%, 85%)",
              }}
            />
            <Area type="monotone" dataKey={metric} stroke="hsl(220, 70%, 55%)" strokeWidth={2} fill="url(#gradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
