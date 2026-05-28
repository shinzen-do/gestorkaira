-- API keys para conectores externos (Claude.ai MCP, automações, integrações).
-- Cada usuário pode gerar múltiplas chaves nomeadas.
-- A chave em texto plano só aparece uma vez no momento da criação;
-- guardamos apenas o hash SHA-256 hex.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists api_keys_user_id_idx on public.api_keys(user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

-- Dono lê suas chaves
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

-- Dono cria
create policy "api_keys_insert_own" on public.api_keys
  for insert with check (auth.uid() = user_id);

-- Dono pode revogar (update revoked_at)
create policy "api_keys_update_own" on public.api_keys
  for update using (auth.uid() = user_id);

-- Dono pode deletar
create policy "api_keys_delete_own" on public.api_keys
  for delete using (auth.uid() = user_id);
