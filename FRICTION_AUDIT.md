# Audit Kaira: UX Friction Points & Onboarding Issues (2026-05-27)

## Findings by Severity

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 7 |
| 🟡 Medium | 9 |
| 🟢 Low | 8 |
| **Total** | **27** |

---

## Detailed Findings

### 🔴 Critical Issues

1. **src/pages/SignupPage.tsx:66** — Auto-login fails silently, user sees generic message. After signup with plan, token/session mismatch on redirect leaves user stranded with "Faça login para continuar" instead of dashboard. Catches `signInError` but only returns toast without navigating to /login as fallback path.

2. **src/contexts/AppDataContext.tsx:LimitUnknown** — No default pagination/limits on initial data fetch. If user has 100+ clients, campaigns, or audiences, first load could timeout or crash UI. AppDataContext loads all data at once with `select("*")` without .limit(). User onboarding creates multiple test entities and fetch stalls.

3. **src/components/dialogs/AudienceDialog.tsx:LimitUnknown** — When audience has 10+ campaigns to link, the checkbox grid in dialog becomes scrollable inline list (no explicit max-height). New user doesn't realize campaigns are cut off, submits incomplete linkage without warning.

---

### 🟠 High Issues

1. **src/pages/HomePage.tsx:58-61** — Empty dashboard shows "Nada pendente" in calendar widget even on fresh signup. No onboarding hint that these metrics will populate. User sees blank cards and thinks app is broken, not that they need to create clients first.

2. **src/pages/ClientsPage.tsx:355-359** — Campaign creation tab shows "Nenhuma campanha ainda" but button is _inside_ the tab. First-time user must expand client card, click campaigns tab, then see the button. Two steps to discover it (vs. one at card level). Slower discovery → lower conversion.

3. **src/pages/AudiencesPage.tsx:127-138** — After creating audience, no toast confirms success AND immediately shows card. User might think submission failed and click "Novo público" again, creating duplicate. Tone is silent success.

4. **src/pages/PacingPage.tsx:186-194** — Day input defaults to `effectiveDay` but shows no visual hint when it's pre-filled. User types day 1 unaware field already has "today" (27), overwrites blind. No placeholder text like "deixe em branco para hoje". Confusion → wrong spend recorded.

5. **src/pages/CalendarPage.tsx:146-150** — Link selector in new note dialog doesn't show "linked campaigns" count inline. User picks "Campanha" as link type but then sees empty list if there are 0 campaigns. No feedback that they must create campaigns first. Stalls onboarding flow.

6. **src/pages/TasksPage.tsx:56** — AI task generation returns "não encontrou tarefas claras" but user doesn't know if input was bad or API failed. No guidance on what format IA expects (bullets, full text, structured). Blocks adoption of feature.

7. **src/pages/SettingsPage.tsx:118-137** — Language selector is disabled with "Em breve" badge but takes visual space and is pointer-events-none. Confuses new user: is this buggy? Was supposed to work? Better to remove or gate it entirely.

---

### 🟡 Medium Issues

1. **src/pages/SignupPage.tsx:35-38** — Password validation only checks length (8 chars) via `minLength` HTML + toast. No real-time feedback or strength meter. User gets hard error on submit instead of inline guidance. Slower, more frustrating UX.

2. **src/pages/LoginPage.tsx:85-102** — Forgot password flow is a separate handler, not integrated into form. User must spot the small "Esqueceu?" link and click it. No recovery hint on auth fail. Better: show recovery prompt _only_ after bad login to guide user to right path.

3. **src/pages/ClientsPage.tsx:276-298** — Client mini-dashboard inside expanded card is dense (4 metrics in 2×2 grid, hidden under ChevronRight click). New user doesn't see ROAS or spend until they expand the card. Metrics should peek in collapsed view to tease the dashboard.

4. **src/pages/AudiencesPage.tsx:17-79** — Audience card shows "Ativo em {linkedCamps.length} campanha(s)" but does NOT show if audience is actually used in any ads (creative count, spend). New user can't tell if their audience is "alive" or just sitting idle.

5. **src/pages/PacingPage.tsx:360-479** — Budget and daily spend inputs use number type, but parsing logic supports "R$ 1.250,50" → float. Form hints say "Ex: 5000" but real users might paste "R$ 5.000" from email and it fails silently with toast. Better: show formatted placeholder with actual currency mask.

6. **src/pages/CalendarPage.tsx:251-258** — Calendar modifiers (hasNote, hasChange, hasPlanned) use dots and rings that are visually tiny on mobile. New user might miss that dates have events. Modifiers should be bolder or use larger indicators on small screens.

7. **src/pages/TimelinePage.tsx:119-145** — Timeline export (CSV/PDF) works but dialog says "Nada para exportar" when filters yield 0 results. User who just created first client has no timeline entries and sees "disabled button". No onboarding hint that history gets recorded once they toggle "Modo Histórico" in settings.

8. **src/pages/ProgrammingPage.tsx:80** — Planning campaigns requires opening ClientProgrammingSection but there's no inline help about budget_type (daily vs. total). User doesn't know difference between "R$ 100/dia" and "R$ 2000 total". Better: add small icon with tooltip.

9. **src/components/dialogs/CampaignDialog.tsx:21** — Objectives list is hardcoded with 8 options ("Vendas", "Geração de Leads", etc.) but no option to skip or add custom. User's niche objective (e.g., "Afiliação") is missing → forced to pick closest match. Poor domain fit.

---

### 🟢 Low Issues

1. **src/pages/HomePage.tsx:92** — Upcoming tasks show "próxima(s)" with count but grammar breaks on 1 task: "1 próxima(s)" → should be "1 próxima". Minor but signals sloppiness.

2. **src/pages/ClientsPage.tsx:178** — Spend display uses toLocaleString but doesn't pad decimals. Shows "R$ 1.200" vs "R$ 1.200,00", inconsistent. Visual polish issue.

3. **src/pages/AudiencesPage.tsx:38-40** — Interests displayed as plain tags with no truncation. If user adds 20 interests, card height explodes. Should limit to 5 inline + "show more".

4. **src/pages/PacingPage.tsx:42-53** — parseAmount function accepts multiple formats but error message is generic "Valor inválido". If user pastes "R$ --5.000" (weird copy-paste), error doesn't hint what went wrong.

5. **src/pages/CalendarPage.tsx:200-235** — NoteCard uses line-through when done but opacity-60 on container. Combination makes it very faint, harder to scan completed tasks from pending.

6. **src/pages/TasksPage.tsx:81** — Page padding is `p-2` on mobile but main layout is max-w-5xl with mx-auto. On narrow screens, 2px padding gets clipped. Better: use standard responsive padding.

7. **src/pages/TimelinePage.tsx:134** — Loading state just says "Carregando..." with no skeleton or animated loader. User thinks page is hung. Should use PageSkeletons or at least a spinner.

8. **src/pages/SettingsPage.tsx:88-103** — Profile section has disabled email field but no explanation _why_ it's disabled. User might expect to change email here but can't. Better: hint "mudar email requer verificação de segurança" or remove the field.

---

## Summary

**Blockers (🔴):** Auto-login silent fail leaves new user post-signup unable to enter dashboard. Data fetch unbounded causes lag/crash on moderate datasets. Audience campaign linking silent truncation causes data loss.

**Friction (🟠):** Empty state messaging, nested create buttons, visual affordance issues, and missing domain guidance slow down first 5 interactions. Password validation, recovery flow, and spend input masking add micro-friction.

**Polish (🟡/🟢):** Grammar, display consistency, layout edge cases, and UI feedback clarity need tightening but don't block conversion.

**Recommendation for 16yo founder:** Fix 🔴 issues before Loom gravação (affects demo credibility). Polish 🟠 high-friction items before dogfooding (affects onboarding→ $1k conversion). 🟡/🟢 are refine-later.

---

