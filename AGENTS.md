# Notas para agentes (Claude Code & co.)

Convenções e gotchas específicas do Kaira. Leia antes de mexer.

## Stack & Patterns

- **Vite + React 18** (NÃO é Next.js). Sem Server Components, sem `app/` dir.
- **React Router v6** (`BrowserRouter` + `Routes`/`Route`). NÃO existe `next/link`.
- **TanStack Query** está disponível mas o estado global de dados está em `AppDataContext` (carregamento eager no boot).
- **Supabase JS v2** com `localStorage` (não SSR). Cliente único em `@/integrations/supabase/client`.
- **Tailwind + Shadcn**. Use as primitives já em `src/components/ui/` antes de criar nova.
- **Aliases:** `@/...` resolve para `src/...`.

## RLS / multi-tenant

- Toda tabela em `public` precisa de `enable row level security` + policy `auth.uid() = user_id`.
- Padrão `FOR ALL TO authenticated USING (...) WITH CHECK (...)`.
- Quando criar nova tabela: incluir migration nova em `supabase/migrations/` e atualizar `integrations/supabase/types.ts` (gerado pelo Supabase CLI — não editar manual).

## Auth

- `useAuth()` do `AuthContext` para usuário logado.
- Senha mínima: **8 caracteres** (Signup + Reset).
- Auto-confirm de email está ativo. Signup faz auto-login direto.
- Plano selecionado vem em `?plan=` na URL e é salvo em `user_metadata.intended_plan`.

## Performance

- Páginas internas (autenticadas) usam `React.lazy` em `App.tsx`. Mantenha esse padrão ao adicionar nova rota.
- `vite.config.ts` tem `manualChunks` separando react/query/motion/pdf/date/supabase. Não duplicar libs sem dedupe.
- Logo importado de `@/assets/kaira-logo.webp` + `kaira-logo-2x.webp` (responsive). Nunca importar o PNG original 2MB.

## i18n

- Adicione novas chaves em `src/contexts/LanguageContext.tsx` nos 3 idiomas (pt, en, es).
- Hard-coded strings em PT são aceitáveis em copy específico de produto (landing, hero), mas labels de UI devem usar `t("chave")`.

## Edge functions

- `ai-summarize-tasks` ainda depende do gateway Lovable. Migrar para Anthropic/OpenAI direto é prioridade pra remover lock-in.

## O que NÃO fazer

- Não editar `src/integrations/supabase/types.ts` à mão (é gerado).
- Não importar `kaira-logo.png` original (2MB) — usar webp via `KairaLogo`.
- Não criar testimonials/stats fake na Landing. Já foram removidos por decisão do produto.
- Não usar `any` em catch blocks. Tipar como `unknown` e narrow.

## Comandos sanitários

```bash
npm run build   # ~12s, sem erros esperado
npx tsc --noEmit   # zero erros esperado
npm run lint   # warnings cosméticos aceitáveis, errors devem ser zero
```
