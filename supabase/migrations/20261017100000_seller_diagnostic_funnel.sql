-- Tunnel vendeur « Pourquoi mon bien ne se vend pas ? ».
-- Aucune donnée client ou donnée de démonstration n'est créée par cette migration.

create table public.seller_diagnostic_leads (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default ('PKV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  email_normalized text generated always as (lower(nullif(btrim(email), ''))) stored,
  preferred_channel text,
  privacy_consent boolean not null default false,
  marketing_consent boolean not null default false,
  property_type text not null,
  island text not null,
  commune text not null,
  sale_duration text not null,
  sale_method text not null,
  mandate_active boolean,
  mandate_type text,
  mandate_end_date date,
  diffusion_channels text[] not null default '{}',
  presentation_assets text[] not null default '{}',
  visits_level text not null,
  visits_count integer check(visits_count is null or visits_count >= 0),
  offers_status text not null,
  failed_offer_reason text,
  current_price_xpf numeric check(current_price_xpf is null or current_price_xpf >= 0),
  initial_price_xpf numeric check(initial_price_xpf is null or initial_price_xpf >= 0),
  last_price_change date,
  feedback text[] not null default '{}',
  objective text not null,
  diagnosis jsonb not null default '{}',
  priority_level text not null check(priority_level in ('P1','P2','P3')),
  pipeline public.foncier_pipeline not null default 'new',
  source text not null default 'website_seller_diagnostic',
  acquisition jsonb not null default '{}',
  next_action text,
  next_follow_up timestamptz,
  booking_token_hash text,
  last_submission_hash text,
  last_submission_at timestamptz,
  sheet_sync_status text not null default 'not_connected',
  sheet_sync_error text,
  sheet_synced_at timestamptz,
  retention_until timestamptz not null default now() + interval '24 months'
);

create index seller_diagnostic_phone_idx on public.seller_diagnostic_leads(phone_normalized);
create index seller_diagnostic_email_idx on public.seller_diagnostic_leads(email_normalized) where email_normalized is not null;
create index seller_diagnostic_pipeline_idx on public.seller_diagnostic_leads(pipeline, created_at desc);
create index seller_diagnostic_followup_idx on public.seller_diagnostic_leads(next_follow_up) where next_follow_up is not null;

create table public.seller_diagnostic_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.seller_diagnostic_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'
);

create table public.seller_diagnostic_appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.seller_diagnostic_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Pacific/Tahiti',
  mode text not null check(mode in ('phone','on_site')),
  status text not null default 'confirmed' check(status in ('confirmed','cancelled','completed','no_show')),
  confirmation_reference text unique not null default ('RDV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
);

create index seller_diagnostic_appointment_start_idx on public.seller_diagnostic_appointments(start_at);

create or replace function public.book_seller_diagnostic_appointment(target_lead uuid,target_start timestamptz,target_end timestamptz,target_mode text)
returns public.seller_diagnostic_appointments language plpgsql security definer set search_path=public as $$
declare created public.seller_diagnostic_appointments;
begin
  perform pg_advisory_xact_lock(hashtext('mathildekw-appointments'));
  if target_start <= now() or target_end <= target_start or target_end-target_start <> interval '45 minutes' or target_mode not in ('phone','on_site') then raise exception 'invalid_slot'; end if;
  if exists(select 1 from public.foncier_appointments where status='confirmed' and tstzrange(start_at,end_at,'[)') && tstzrange(target_start,target_end,'[)'))
    or exists(select 1 from public.seller_diagnostic_appointments where status='confirmed' and tstzrange(start_at,end_at,'[)') && tstzrange(target_start,target_end,'[)')) then raise exception 'slot_unavailable'; end if;
  insert into public.seller_diagnostic_appointments(lead_id,start_at,end_at,mode) values(target_lead,target_start,target_end,target_mode) returning * into created;
  return created;
end $$;
revoke all on function public.book_seller_diagnostic_appointment(uuid,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.book_seller_diagnostic_appointment(uuid,timestamptz,timestamptz,text) to service_role;

create table public.seller_diagnostic_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id uuid not null,
  event_name text not null check(event_name in ('landing_view','cta_clicked','diagnostic_started','step_completed','diagnostic_abandoned','diagnostic_submitted','lead_recorded','appointment_viewed','appointment_confirmed','callback_requested')),
  lead_id uuid references public.seller_diagnostic_leads(id) on delete set null,
  page_path text,
  traffic_source text,
  utm jsonb not null default '{}',
  metadata jsonb not null default '{}'
);

create index seller_diagnostic_event_idx on public.seller_diagnostic_events(created_at, event_name);

alter table public.seller_diagnostic_leads enable row level security;
alter table public.seller_diagnostic_activities enable row level security;
alter table public.seller_diagnostic_appointments enable row level security;
alter table public.seller_diagnostic_events enable row level security;

create policy "foncier admins seller leads" on public.seller_diagnostic_leads for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins seller activities" on public.seller_diagnostic_activities for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins seller appointments" on public.seller_diagnostic_appointments for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins seller events" on public.seller_diagnostic_events for select to authenticated using(public.is_foncier_admin());

create or replace function public.seller_diagnostic_metrics(date_from timestamptz default now() - interval '30 days')
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'landing_views', count(*) filter(where event_name='landing_view'),
    'started', count(*) filter(where event_name='diagnostic_started'),
    'completed', count(*) filter(where event_name='diagnostic_submitted'),
    'leads', count(*) filter(where event_name='lead_recorded'),
    'appointments', count(*) filter(where event_name='appointment_confirmed'),
    'conversion_rate', case when count(*) filter(where event_name='diagnostic_started')=0 then 0 else round(100.0*count(*) filter(where event_name='lead_recorded')/count(*) filter(where event_name='diagnostic_started'),1) end,
    'by_source', coalesce((select jsonb_object_agg(source,total) from(select coalesce(traffic_source,'direct') source,count(distinct session_id) total from public.seller_diagnostic_events where created_at>=date_from group by 1)s),'{}'::jsonb)
  ) from public.seller_diagnostic_events where created_at>=date_from
$$;

revoke all on function public.seller_diagnostic_metrics(timestamptz) from public, anon;
grant execute on function public.seller_diagnostic_metrics(timestamptz) to authenticated;

create or replace function public.generate_seller_diagnostic_followups()
returns integer language plpgsql security definer set search_path=public as $$
declare inserted integer;
begin
  insert into public.foncier_notifications(kind,title,body,entity_type,entity_id)
  select 'seller_followup_due', case when priority_level='P1' then 'Relance vendeur prioritaire' else 'Relance vendeur à effectuer' end,
    reference || ' · ' || property_type || ' · ' || commune, 'seller_diagnostic', id
  from public.seller_diagnostic_leads lead
  where next_follow_up is not null and next_follow_up <= now() + interval '24 hours'
    and pipeline not in ('sold','abandoned','not_relevant')
    and not exists(select 1 from public.foncier_notifications notification where notification.kind='seller_followup_due' and notification.entity_id=lead.id and notification.created_at >= lead.next_follow_up - interval '24 hours');
  get diagnostics inserted = row_count;
  return inserted;
end $$;
revoke all on function public.generate_seller_diagnostic_followups() from public,anon,authenticated;
grant execute on function public.generate_seller_diagnostic_followups() to service_role;
