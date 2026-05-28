-- Admin metrics RPC: agregado simples de signups, UTM, planos e atividade.
-- SECURITY DEFINER + validação por email do caller (auth.email()).
-- Mais robusto que role-based pra MVP. Refatora pra tabela admin_users se crescer.

create or replace function public.admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_admin_emails text[] := array[
    'essenciamarketingegestao@gmail.com',
    'emanueldsouzamello@gmail.com'
  ];
  v_total_users int;
  v_users_24h int;
  v_users_7d int;
  v_users_30d int;
  v_with_clients int;
  v_with_campaigns int;
  v_paid_intent int;
  v_lifetime_intent int;
  v_utm_breakdown jsonb;
  v_plan_breakdown jsonb;
  v_recent jsonb;
begin
  v_email := auth.email();
  if v_email is null or not (v_email = any(v_admin_emails)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select count(*) into v_total_users from auth.users;
  select count(*) into v_users_24h from auth.users where created_at >= now() - interval '24 hours';
  select count(*) into v_users_7d from auth.users where created_at >= now() - interval '7 days';
  select count(*) into v_users_30d from auth.users where created_at >= now() - interval '30 days';

  select count(distinct user_id) into v_with_clients from public.clients;
  select count(distinct user_id) into v_with_campaigns from public.campaigns;

  select count(*) into v_paid_intent from auth.users
    where raw_user_meta_data ->> 'intended_plan' in ('pro_monthly','pro_yearly','lifetime');
  select count(*) into v_lifetime_intent from auth.users
    where raw_user_meta_data ->> 'intended_plan' = 'lifetime';

  with utm as (
    select coalesce(raw_user_meta_data #>> '{utm,utm_source}', 'direct') as source,
           count(*) as n
    from auth.users
    group by 1 order by n desc limit 10
  )
  select jsonb_agg(jsonb_build_object('source', source, 'count', n)) into v_utm_breakdown from utm;

  with plan_dist as (
    select coalesce(raw_user_meta_data ->> 'intended_plan', 'free') as plan,
           count(*) as n
    from auth.users
    group by 1 order by n desc
  )
  select jsonb_agg(jsonb_build_object('plan', plan, 'count', n)) into v_plan_breakdown from plan_dist;

  with recent as (
    select id, email, created_at, raw_user_meta_data ->> 'full_name' as name,
           coalesce(raw_user_meta_data ->> 'intended_plan', 'free') as plan,
           raw_user_meta_data #>> '{utm,utm_source}' as utm_source
    from auth.users order by created_at desc limit 25
  )
  select jsonb_agg(jsonb_build_object(
    'id', id, 'email', email, 'name', name, 'plan', plan,
    'utm_source', utm_source, 'created_at', created_at
  )) into v_recent from recent;

  return jsonb_build_object(
    'total_users', v_total_users,
    'users_24h', v_users_24h,
    'users_7d', v_users_7d,
    'users_30d', v_users_30d,
    'activated_with_clients', v_with_clients,
    'activated_with_campaigns', v_with_campaigns,
    'paid_intent', v_paid_intent,
    'lifetime_intent', v_lifetime_intent,
    'utm_breakdown', coalesce(v_utm_breakdown, '[]'::jsonb),
    'plan_breakdown', coalesce(v_plan_breakdown, '[]'::jsonb),
    'recent_signups', coalesce(v_recent, '[]'::jsonb),
    'generated_at', now()
  );
end;
$$;

revoke all on function public.admin_metrics() from public;
grant execute on function public.admin_metrics() to authenticated;
