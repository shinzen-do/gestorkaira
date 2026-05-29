-- Fix: create_oauth_code falhava com "function gen_random_bytes does not exist".
-- gen_random_bytes vem da extensão pgcrypto, que no Supabase fica no schema
-- `extensions`, fora do search_path da função (= public). Resultado: o passo
-- "Autorizar" do conector MCP dava erro vermelho.
--
-- Solução: gerar o code a partir de gen_random_uuid() (nativo do Postgres core,
-- sem dependência de extensão). 3 UUIDs concatenados sem hífens = 96 chars hex,
-- aleatório e URL-safe. Mantém o resto da função idêntico.

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

  -- Code aleatório sem pgcrypto: 3× gen_random_uuid() (core) sem hífens.
  v_code := replace(
    gen_random_uuid()::text || gen_random_uuid()::text || gen_random_uuid()::text,
    '-', ''
  );

  insert into public.oauth_codes (code, user_id, client_id, redirect_uri, code_challenge, code_challenge_method, scope)
  values (v_code, v_user, p_client_id, p_redirect_uri, p_code_challenge, p_code_challenge_method, p_scope);

  return v_code;
end;
$$;

revoke all on function public.create_oauth_code(text, text, text, text, text) from public;
grant execute on function public.create_oauth_code(text, text, text, text, text) to authenticated;
