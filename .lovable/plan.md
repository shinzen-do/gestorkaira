## Plano de melhorias Kaira

Vou implementar em ordem de prioridade. Como é um pacote grande, divido em fases para você acompanhar.

### Fase 1 — Correções e ajustes rápidos
1. **Logo Kaira (K prata + flecha dourada)** substituindo o "K" azul:
   - Salvar a imagem enviada em `src/assets/kaira-logo.png` (já existe, vou sobrescrever).
   - Aplicar em: topo da Landing, Login, Signup, Reset Password, sidebar.
2. **Persistir formulários abertos** (Cliente, Campanha, Público, Programada, Criativo, etc.):
   - Wrapper `usePersistentDialog(formKey)` que salva rascunho em `localStorage` e reabre o diálogo automaticamente quando o usuário volta à página.
3. **Histórico do Pacing ordenado**: ordenar `daily_spends` por `day` ascendente (1 → 31) na página de Pacing.
4. **CBO vs ABO na campanha**:
   - Adicionar campo `budget_strategy` (`cbo` | `abo`) em `campaigns`.
   - Se CBO → orçamento na campanha, AdSet sem campo de orçamento.
   - Se ABO → orçamento por AdSet (comportamento atual).

### Fase 2 — Programação e Tarefas
5. **Campanhas programadas → "Ativar agora"**: botão na lista para marcar uma programada como `active` imediatamente (independente da data).
6. **Aba Tarefas substituindo a atual**: lista unificada de pendências:
   - Programadas que devem **ativar hoje** (start_date = hoje, status=planned).
   - Programadas que devem **desativar hoje** (end_date < hoje, status=active).
   - Tarefas geradas por IA (ver item 7).
   - Notas de calendário com `done=false` da data atual.
   - Cada item com botão "Marcar como feito" → muda status apropriado.

7. **Bloco "Pedir à IA"** (em Tarefas):
   - Textarea onde o usuário cola mensagens/texto livre.
   - Edge function `ai-summarize-tasks` chamando Lovable AI Gateway (`google/gemini-2.5-flash`) que retorna lista de tarefas estruturadas.
   - Tarefas salvas em nova tabela `ai_tasks` (título, descrição, due_date, done).

### Fase 3 — Alertas no Dashboard
8. **Alertas de pacing fora do padrão**:
   - No HomePage, calcular pacing de cada cliente do mês atual.
   - Mostrar banner "X clientes com pacing fora do padrão" + lista (acima/abaixo) com link para Pacing.
   - Critério: desvio > 10% do esperado (gasto/dia ideal vs real até hoje).

### Fase 4 — Seguidores
9. **Nova seção "Seguidores"** no menu:
   - Tabela `follower_snapshots` (client_id, date, instagram, facebook, tiktok — colunas opcionais nullable).
   - Página com seletor de cliente + data, inputs de redes (Instagram fixo, Facebook/TikTok adicionáveis e removíveis).
   - Histórico em lista/gráfico simples por cliente.

### Fase 5 — Tutorial e modo "Setup"
10. **Tutorial onboarding (primeira entrada)**:
    - Modal multi-passo (driver.js style com Framer Motion próprio) cobrindo: Clientes, Campanhas, AdSets, Criativos, Públicos, Pacing, Programação, Tarefas+IA, Calendário, Seguidores, Configuração "Modo Histórico".
    - Salvar `tutorial_completed` em `user_settings`.
    - Botão "Refazer tutorial" em Configurações.
11. **Modo "Histórico de mudanças" (oculto)**:
    - Nova flag em `user_settings`: `history_tracking_enabled` (default false).
    - Quando ligado, registra em `timeline_entries` toda criação/edição/exclusão (já existe a tabela e parte do código).
    - Configuração em Settings, com aviso de que o usuário deve ativar só depois de finalizar o setup inicial.
    - Tutorial explica esse fluxo.

### Detalhes técnicos
- **Migrations necessárias**:
  - `ALTER TABLE campaigns ADD COLUMN budget_strategy text NOT NULL DEFAULT 'abo'`
  - `CREATE TABLE ai_tasks (...)` com RLS por user_id
  - `CREATE TABLE follower_snapshots (...)` com RLS por user_id
  - `ALTER TABLE user_settings ADD COLUMN tutorial_completed bool DEFAULT false, ADD COLUMN history_tracking_enabled bool DEFAULT false`
- **Edge function**: `ai-summarize-tasks` usando `LOVABLE_API_KEY` e `gemini-2.5-flash`.
- **Persistência de diálogos**: hook genérico `useDraft(key, initialValue)` em `src/hooks/useDraft.ts`.

### Tamanho estimado
~15-20 arquivos novos/editados, 3 migrations, 1 edge function. Vou implementar em uma sequência só após aprovação, e te entrego o resumo no final.

Confirma que posso ir em frente com tudo isso?