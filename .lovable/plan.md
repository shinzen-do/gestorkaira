

## Plano: Landing Page + Autenticação (Login/Cadastro) para Kaira

### Visão Geral

Criar uma landing page pública de apresentação do Kaira, páginas de Login e Cadastro com email/senha, e proteger as rotas internas (Dashboard, Clients, Timeline) para usuários autenticados. Perfis de usuário serão armazenados via Supabase (Lovable Cloud).

---

### 1. Ativar Lovable Cloud (Supabase)

- Habilitar backend Supabase via Lovable Cloud para autenticação e armazenamento de perfis.
- Criar tabela `profiles` com campos: `id` (FK para `auth.users`), `full_name`, `avatar_url`, `created_at`.
- Habilitar RLS na tabela `profiles` com políticas para leitura/escrita do próprio usuário.
- Criar trigger para auto-criação do perfil ao signup.

### 2. Landing Page (`/landing`)

Uma página full-screen sem sidebar, com a estética de luxo do Kaira:

- **Hero Section**: Título impactante ("A Central de Comando para Gestores de Elite"), subtítulo, e botões CTA "Começar Agora" e "Entrar".
- **Features Section**: 3-4 cards com glassmorphism destacando os diferenciais (Timeline de Mudanças, Gestão Hierárquica, Dashboard de Performance).
- **Footer** minimalista com a marca Kaira.
- Animações com Framer Motion (fade-in, slide-up).

### 3. Páginas de Autenticação (`/login` e `/signup`)

- Layout centralizado, sem sidebar, com card glassmorphism.
- **Login**: Email + Senha, link "Esqueceu a senha?", link para Cadastro.
- **Signup**: Nome completo, Email, Senha, link para Login.
- Validação com react-hook-form + zod.
- Integração com `supabase.auth.signInWithPassword` e `supabase.auth.signUp`.

### 4. Página de Reset de Senha (`/reset-password`)

- Formulário para definir nova senha após clicar no link do email.
- Usa `supabase.auth.updateUser({ password })`.

### 5. Contexto de Autenticação

- Criar `AuthContext` com `onAuthStateChange` + `getSession`.
- Componente `ProtectedRoute` que redireciona para `/login` se não autenticado.

### 6. Reestruturação de Rotas (`App.tsx`)

```text
/           → Landing Page (pública)
/login      → Login (pública)
/signup     → Cadastro (pública)
/reset-password → Reset senha (pública)
/dashboard  → Dashboard (protegida, com AppLayout/sidebar)
/clients    → Clientes (protegida)
/timeline   → Histórico (protegida)
```

- Landing, Login, Signup e Reset renderizam SEM o `AppLayout` (sem sidebar).
- Rotas protegidas mantêm o `AppLayout` com sidebar.
- Sidebar link "Kaira" no header passa a apontar para `/dashboard`.

---

### Detalhes Técnicos

| Item | Detalhe |
|------|---------|
| Autenticação | Supabase Auth (email/senha) via Lovable Cloud |
| Perfis | Tabela `profiles` com RLS + trigger `on_auth_user_created` |
| Validação | zod + react-hook-form |
| Animações | Framer Motion |
| Estilo | Glassmorphism, paleta existente (#09090b, cobalt, gold) |

### Arquivos Novos
- `src/pages/LandingPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- Migration para tabela `profiles`

### Arquivos Modificados
- `src/App.tsx` — nova estrutura de rotas
- `src/components/KairaSidebar.tsx` — ajustar links

