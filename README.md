# Kaira

Central de comando para gestores de tráfego pago. Substitui planilhas e Trello.

## Stack

- **Vite + React 18 + SWC**
- **Tailwind + Shadcn/UI** (Radix)
- **Supabase** (auth + Postgres + edge functions)
- **TanStack Query** (cache de servidor)
- **Framer Motion** (animações)
- **React Hook Form + Zod**
- **jsPDF + html2canvas** (export)
- **date-fns** (datas)
- **next-themes** (dark/light)
- **i18n próprio** via `LanguageContext` (PT, EN, ES)

## Setup local

```bash
npm install
cp .env .env.local   # ajustar credenciais Supabase se necessário
npm run dev          # sobe em http://localhost:8080
```

Comandos úteis:

```bash
npm run build        # build de produção
npm run lint         # eslint
npm run test         # vitest
node scripts/optimize-logo.mjs   # re-gera assets do logo
```

## Estrutura

```
src/
├── App.tsx                 # rotas + providers globais
├── components/
│   ├── AppLayout.tsx       # shell do dashboard (sidebar + header)
│   ├── KairaSidebar.tsx
│   ├── GlobalSearch.tsx    # ⌘K
│   ├── PacingAlertsBanner.tsx
│   ├── TutorialModal.tsx
│   ├── dialogs/            # CRUD dialogs (Cliente, Campanha, ...)
│   ├── shared/             # componentes reutilizáveis
│   └── ui/                 # shadcn primitives
├── contexts/
│   ├── AppDataContext.tsx  # estado global de dados (clientes, campanhas, ...)
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── LanguageContext.tsx
├── integrations/supabase/  # cliente + types gerados
├── pages/                  # uma rota = um arquivo
└── lib/
```

## Banco de dados

17 tabelas principais (todas com RLS por `auth.uid() = user_id`):

- `profiles`, `clients`, `campaigns`, `ad_sets`, `creatives`, `validated_creatives`
- `audiences`, `audience_campaigns`
- `monthly_budgets`, `daily_spends`, `planned_campaigns`
- `calendar_notes`, `timeline_entries`
- `ai_tasks`, `follower_snapshots`
- `user_settings`

Migrations em `supabase/migrations/`.

## Edge functions

- `ai-summarize-tasks`: usa `ai.gateway.lovable.dev` (dependência Lovable). **TODO:** migrar para chamada direta Anthropic/OpenAI para remover lock-in.

## Roadmap MVP

- **Semana 1** (até 2026-06-02): feature-complete, dogfooding.
- **Semana 2** (até 2026-06-09): pagamento (Stripe/Hotmart), deploy, domínio.
- **Semana 3** (até 2026-06-16): tráfego pago para captura de primeiros pagantes.
- **Buffer** (até 2026-06-25): meta de R$ 1.000 em vendas.

## Planos de preço

| Plano | Preço | Detalhe |
|---|---|---|
| Free | R$ 0 | 1 cliente ativo |
| Pro Mensal | R$ 47/mês | foco do plano |
| Pro Anual | R$ 470/ano | 2 meses grátis |
| Vitalício Launch | R$ 497 único | limitado a 50 vagas |

Captura de plano via `?plan=pro_monthly|pro_yearly|lifetime` em `/signup`, salvo em `user_metadata.intended_plan` até o billing real estar conectado.
