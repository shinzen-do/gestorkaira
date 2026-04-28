export type HealthStatus = "green" | "yellow" | "red";

export interface TimelineEntry {
  id: string;
  date: string;
  type: "creative" | "budget" | "audience" | "bid" | "status" | "note";
  description: string;
  details?: string;
  impact?: "positive" | "negative" | "neutral";
}

export type Gender = "all" | "male" | "female";

export interface Audience {
  id: string;
  name: string;
  status: "active" | "paused";
  gender: Gender;
  ageMin: number;
  ageMax: number;
  interests: string[];
  size?: number;
  clientId?: string;
  description?: string;
}

export interface Creative {
  id: string;
  name: string;
  format: "image" | "video" | "carousel";
  status: "active" | "paused";
  thumbnail?: string;
  ctr?: number;
  impressions?: number;
  notes?: string;
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
  audienceIds?: string[];
  creatives?: Creative[];
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

export interface ValidatedCreative {
  id: string;
  name: string;
  format: "image" | "video" | "carousel";
  validatedAt: string;
  validatedBy?: string;
  tags?: string[];
  notes?: string;
  performance?: { ctr?: number; cpa?: number; roas?: number };
  url?: string;
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
  validatedCreatives?: ValidatedCreative[];
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

export const audiences: Audience[] = [
  {
    id: "aud1",
    name: "CTOs & VPs Engenharia",
    status: "active",
    gender: "all",
    ageMin: 30,
    ageMax: 55,
    interests: ["SaaS", "Cloud Computing", "DevOps", "Engenharia de Software"],
    size: 420000,
    clientId: "c1",
    description: "Decisores técnicos em empresas com 50+ funcionários",
  },
  {
    id: "aud2",
    name: "Founders Startup BR",
    status: "active",
    gender: "all",
    ageMin: 25,
    ageMax: 45,
    interests: ["Empreendedorismo", "Venture Capital", "Y Combinator", "Startups"],
    size: 180000,
    clientId: "c1",
    description: "Fundadores de startups early-stage no Brasil",
  },
  {
    id: "aud3",
    name: "Visitantes Trial 7d",
    status: "active",
    gender: "all",
    ageMin: 22,
    ageMax: 60,
    interests: ["Retargeting Pixel", "Visitou /trial"],
    size: 12000,
    clientId: "c1",
    description: "Custom Audience de trials não convertidos",
  },
  {
    id: "aud4",
    name: "Mulheres Skincare 25-45",
    status: "active",
    gender: "female",
    ageMin: 25,
    ageMax: 45,
    interests: ["Skincare", "Vitamina C", "Beleza", "Sephora", "Dermatologia"],
    size: 2400000,
    clientId: "c2",
    description: "Mulheres interessadas em rotina de cuidados faciais",
  },
  {
    id: "aud5",
    name: "Lookalike Compradoras 1%",
    status: "paused",
    gender: "female",
    ageMin: 22,
    ageMax: 55,
    interests: ["Lookalike", "Base: compradoras 90d"],
    size: 2100000,
    clientId: "c2",
    description: "LAL 1% baseado em compradoras dos últimos 90 dias",
  },
  {
    id: "aud6",
    name: "Broad Nacional Fitness",
    status: "active",
    gender: "all",
    ageMin: 18,
    ageMax: 55,
    interests: ["Fitness", "Emagrecimento", "Academia"],
    size: 18000000,
    clientId: "c3",
    description: "Segmentação ampla — performando abaixo da meta",
  },
  {
    id: "aud7",
    name: "Engajados Instagram 30d",
    status: "paused",
    gender: "all",
    ageMin: 20,
    ageMax: 50,
    interests: ["Engajamento orgânico", "Stories", "Reels"],
    size: 45000,
    clientId: "c3",
    description: "Pessoas que interagiram nos últimos 30 dias",
  },
];

const sampleCreatives: Record<string, Creative[]> = {
  as1: [
    { id: "cr1", name: "Vídeo UGC — Depoimento CTO", format: "video", status: "active", ctr: 3.8, impressions: 142000, notes: "Top performer da semana" },
    { id: "cr2", name: "Estático — Headline ROI", format: "image", status: "active", ctr: 2.1, impressions: 98000 },
    { id: "cr3", name: "Carrossel — 5 features", format: "carousel", status: "paused", ctr: 1.2, impressions: 54000 },
  ],
  as2: [
    { id: "cr4", name: "Vídeo Founder Story", format: "video", status: "active", ctr: 2.4, impressions: 88000 },
    { id: "cr5", name: "Estático — Pitch Deck", format: "image", status: "active", ctr: 1.8, impressions: 62000 },
  ],
  as3: [
    { id: "cr6", name: "Retargeting — Oferta 30%", format: "image", status: "active", ctr: 4.5, impressions: 24000, notes: "Conversão alta" },
  ],
  as4: [
    { id: "cr7", name: "Carrossel Antes/Depois", format: "carousel", status: "active", ctr: 2.9, impressions: 210000 },
    { id: "cr8", name: "Vídeo Influencer @bellabeauty", format: "video", status: "active", ctr: 3.2, impressions: 180000 },
  ],
  as5: [
    { id: "cr9", name: "Estático Produto Hero", format: "image", status: "paused", ctr: 0.9, impressions: 120000 },
  ],
  as6: [
    { id: "cr10", name: "Vídeo VSL 3min", format: "video", status: "active", ctr: 1.4, impressions: 320000, notes: "CTR baixo, refazer" },
    { id: "cr11", name: "Estático Promessa", format: "image", status: "active", ctr: 1.1, impressions: 280000 },
  ],
};

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
            audienceIds: ["aud1"],
            creatives: sampleCreatives.as1,
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
            audienceIds: ["aud2"],
            creatives: sampleCreatives.as2,
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
            audienceIds: ["aud3"],
            creatives: sampleCreatives.as3,
            timeline: [],
          },
        ],
        timeline: [],
      },
    ],
    validatedCreatives: [
      { id: "vc1", name: "Vídeo UGC — Depoimento CTO", format: "video", validatedAt: "2025-04-22", validatedBy: "Lucas (Diretor Criativo)", tags: ["UGC", "Top performer"], notes: "Aprovado para escalar em todos CAs B2B", performance: { ctr: 3.8, cpa: 19.5, roas: 5.2 } },
      { id: "vc2", name: "Estático — Headline ROI", format: "image", validatedAt: "2025-04-18", validatedBy: "Marina", tags: ["Hook forte"], performance: { ctr: 2.1 } },
      { id: "vc3", name: "Vídeo Founder Story", format: "video", validatedAt: "2025-04-15", validatedBy: "Lucas", tags: ["Storytelling"], performance: { ctr: 2.4, roas: 3.7 } },
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
            audienceIds: ["aud4"],
            creatives: sampleCreatives.as4,
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
            audienceIds: ["aud5"],
            creatives: sampleCreatives.as5,
            timeline: [
              { id: "t8", date: "2025-04-20", type: "status", description: "Pausou CA — CPA acima do limite", impact: "negative" },
            ],
          },
        ],
        timeline: [],
      },
    ],
    validatedCreatives: [
      { id: "vc4", name: "Carrossel Antes/Depois — Sérum", format: "carousel", validatedAt: "2025-04-21", validatedBy: "Marina", tags: ["Antes/Depois", "Prova social"], notes: "Validado para todos lançamentos skincare", performance: { ctr: 2.9 } },
      { id: "vc5", name: "Vídeo Influencer @bellabeauty", format: "video", validatedAt: "2025-04-19", validatedBy: "Lucas", tags: ["Influencer", "UGC"], performance: { ctr: 3.2, roas: 2.8 } },
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
            audienceIds: ["aud6", "aud7"],
            creatives: sampleCreatives.as6,
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
    validatedCreatives: [
      { id: "vc6", name: "Estático — Promessa 21 dias", format: "image", validatedAt: "2025-04-10", validatedBy: "Lucas", tags: ["Promessa"], notes: "Aprovado mas resultado abaixo do esperado", performance: { ctr: 1.1 } },
    ],
  },
];
