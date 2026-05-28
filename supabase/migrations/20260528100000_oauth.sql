-- OAuth 2.0 storage para conector MCP (claude.ai e outros).
-- Tabelas guardam authorization codes (curta duração, PKCE) e access tokens.
-- Cliente final usa o access token como Bearer no MCP server.

-- Authorization codes — vida curta (5 min), uso único.
create table if not exists public.oauth_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  scope text,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_codes_expires_idx on public.oauth_codes(expires_at);

alter table public.oauth_codes enable row level security;
-- Sem policies: tabela é acessada apenas via service role na edge function ou via RPC SECURITY DEFINER.

-- Access tokens — vida longa (180d), revogáveis. Apenas hash armazenado.
create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  token_hash text not null unique,
  scope text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days'),
  revoked_at timestamptz,
  last_used_at timestamptz
);

create index if not exists oauth_tokens_hash_idx on public.oauth_tokens(token_hash);
create index if not exists oauth_tokens_user_idx on public.oauth_tokens(user_id);

alter table public.oauth_tokens enable row level security;

-- Dono lê seus tokens (pra UI listar/revogar)
create policy "oauth_tokens_select_own" on public.oauth_tokens
  for select using (auth.uid() = user_id);

-- Dono pode revogar (update revoked_at)
create policy "oauth_tokens_update_own" on public.oauth_tokens
  for update using (auth.uid() = user_id);

-- Dono pode deletar
create policy "oauth_tokens_delete_own" on public.oauth_tokens
  for delete using (auth.uid() = user_id);

-- DCR clients (opcional — guarda registros de Dynamic Client Registration).
create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text,
  redirect_uris text[] not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_clients enable row level security;
-- Sem policies: acessado via service role.

-- RPC: usuário logado cria authorization code pra um cliente OAuth.
-- Chamado pela página /authorize do Kaira após user confirmar consent.
create or replace function public.create_oauth_code(
  p_client_id text,
  p_redirect_uri text,
  p_code_challenge text,
  p_code_challenge_method text default 'S256',
  p_scope text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;
  if p_code_challenge_method not in ('S256','plain') then
    raise exception 'invalid code_challenge_method';
  end if;

  -- Code = 40 bytes random base64url
  v_code := replace(replace(replace(encode(gen_random_bytes(40), 'base64'), '+', '-'), '/', '_'), '=', '');

  insert into public.oauth_codes (code, user_id, client_id, redirect_uri, code_challenge, code_challenge_method, scope)
  values (v_code, v_user, p_client_id, p_redirect_uri, p_code_challenge, p_code_challenge_method, p_scope);

  return v_code;
end;
$$;

revoke all on function public.create_oauth_code(text, text, text, text, text) from public;
grant execute on function public.create_oauth_code(text, text, text, text, text) to authenticated;
