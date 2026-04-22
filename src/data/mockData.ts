export type HealthStatus = "green" | "yellow" | "red";

export interface TimelineEntry {
  id: string;
  date: string;
  type: "creative" | "budget" | "audience" | "bid" | "status" | "note";
  description: string;
  details?: string;
  impact?: "positive" | "negative" | "neutral";
}

export interface AdSet {
  id: string;
  name: string;
  status: "active" | "paused";
  health: HealthStatus;
  budget: number;
  cpa: number;
  roas: number;
  spend: number;
  conversions: number;
  timeline: TimelineEntry[];
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: "active" | "paused";
  health: HealthStatus;
  budget: number;
  cpa: number;
  roas: number;
  spend: number;
  adSets: AdSet[];
  timeline: TimelineEntry[];
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  health: HealthStatus;
  totalSpend: number;
  avgCpa: number;
  avgRoas: number;
  campaigns: Campaign[];
}

export interface DailyMetric {
  date: string;
  cpa: number;
  roas: number;
  spend: number;
  conversions: number;
}

export const dailyMetrics: DailyMetric[] = [
  { date: "16 Abr", cpa: 32.5, roas: 3.2, spend: 1250, conversions: 38 },
  { date: "17 Abr", cpa: 28.1, roas: 3.8, spend: 1380, conversions: 49 },
  { date: "18 Abr", cpa: 35.2, roas: 2.9, spend: 1100, conversions: 31 },
  { date: "19 Abr", cpa: 26.7, roas: 4.1, spend: 1420, conversions: 53 },
  { date: "20 Abr", cpa: 29.3, roas: 3.6, spend: 1350, conversions: 46 },
  { date: "21 Abr", cpa: 24.8, roas: 4.5, spend: 1500, conversions: 60 },
  { date: "22 Abr", cpa: 22.1, roas: 4.8, spend: 1580, conversions: 71 },
];

export const clients: Client[] = [
  {
    id: "c1",
    name: "TechNova Solutions",
    industry: "SaaS B2B",
    health: "green",
    totalSpend: 45200,
    avgCpa: 24.8,
    avgRoas: 4.2,
    campaigns: [
      {
        id: "camp1",
        name: "Lead Gen — Decision Makers",
        objective: "Geração de Leads",
        status: "active",
        health: "green",
        budget: 3000,
        cpa: 22.1,
        roas: 4.8,
        spend: 2840,
        adSets: [
          {
            id: "as1",
            name: "CA — CTOs & VPs",
            status: "active",
            health: "green",
            budget: 1500,
            cpa: 19.5,
            roas: 5.2,
            spend: 1420,
            conversions: 73,
            timeline: [
              { id: "t1", date: "2025-04-22", type: "creative", description: "Trocou criativo para vídeo UGC", details: "CPA caiu 15% nas primeiras 24h", impact: "positive" },
              { id: "t2", date: "2025-04-20", type: "budget", description: "Subiu orçamento de R$1.000 para R$1.500", details: "Manteve CPA estável", impact: "neutral" },
              { id: "t3", date: "2025-04-18", type: "audience", description: "Segmentou por cargo: CTO, VP Eng", impact: "positive" },
            ],
          },
          {
            id: "as2",
            name: "CA — Founders Startup",
            status: "active",
            health: "yellow",
            budget: 1500,
            cpa: 28.3,
            roas: 3.7,
            spend: 1420,
            conversions: 50,
            timeline: [
              { id: "t4", date: "2025-04-21", type: "note", description: "CPA subindo — monitorar próximos 2 dias" },
              { id: "t5", date: "2025-04-19", type: "audience", description: "Expandiu lookalike de 1% para 3%", impact: "negative" },
            ],
          },
        ],
        timeline: [
          { id: "ct1", date: "2025-04-22", type: "budget", description: "Reajuste de budget geral da campanha", impact: "neutral" },
        ],
      },
      {
        id: "camp2",
        name: "Retargeting — Trial Users",
        objective: "Conversão",
        status: "active",
        health: "green",
        budget: 2000,
        cpa: 15.4,
        roas: 6.1,
        spend: 1860,
        adSets: [
          {
            id: "as3",
            name: "CA — Visitantes 7d",
            status: "active",
            health: "green",
            budget: 2000,
            cpa: 15.4,
            roas: 6.1,
            spend: 1860,
            conversions: 120,
            timeline: [],
          },
        ],
        timeline: [],
      },
    ],
  },
  {
    id: "c2",
    name: "Belle Cosmetics",
    industry: "E-commerce",
    health: "yellow",
    totalSpend: 32100,
    avgCpa: 31.2,
    avgRoas: 3.1,
    campaigns: [
      {
        id: "camp3",
        name: "Lançamento — Sérum Vitamina C",
        objective: "Vendas",
        status: "active",
        health: "yellow",
        budget: 5000,
        cpa: 31.2,
        roas: 3.1,
        spend: 4200,
        adSets: [
          {
            id: "as4",
            name: "CA — Mulheres 25-45 Interesse Skincare",
            status: "active",
            health: "yellow",
            budget: 3000,
            cpa: 33.5,
            roas: 2.8,
            spend: 2600,
            conversions: 77,
            timeline: [
              { id: "t6", date: "2025-04-21", type: "creative", description: "Testou carrossel com antes/depois", impact: "neutral" },
              { id: "t7", date: "2025-04-19", type: "bid", description: "Mudou estratégia de lance para Custo Mais Baixo", impact: "positive" },
            ],
          },
          {
            id: "as5",
            name: "CA — Lookalike Compradoras",
            status: "paused",
            health: "red",
            budget: 2000,
            cpa: 48.7,
            roas: 1.9,
            spend: 1600,
            conversions: 33,
            timeline: [
              { id: "t8", date: "2025-04-20", type: "status", description: "Pausou CA — CPA acima do limite", impact: "negative" },
            ],
          },
        ],
        timeline: [],
      },
    ],
  },
  {
    id: "c3",
    name: "FitPro Academy",
    industry: "Infoproduto",
    health: "red",
    totalSpend: 18500,
    avgCpa: 52.3,
    avgRoas: 1.8,
    campaigns: [
      {
        id: "camp4",
        name: "Webinar — Método FitPro",
        objective: "Inscrições",
        status: "active",
        health: "red",
        budget: 4000,
        cpa: 52.3,
        roas: 1.8,
        spend: 3700,
        adSets: [
          {
            id: "as6",
            name: "CA — Broad Nacional",
            status: "active",
            health: "red",
            budget: 4000,
            cpa: 52.3,
            roas: 1.8,
            spend: 3700,
            conversions: 71,
            timeline: [
              { id: "t9", date: "2025-04-22", type: "note", description: "Urgente: CPA 3x acima da meta. Revisar funil completo." },
              { id: "t10", date: "2025-04-20", type: "audience", description: "Testou segmentação broad — resultado negativo", impact: "negative" },
              { id: "t11", date: "2025-04-18", type: "creative", description: "Novo criativo estático — sem melhoria", impact: "negative" },
            ],
          },
        ],
        timeline: [],
      },
    ],
  },
];
