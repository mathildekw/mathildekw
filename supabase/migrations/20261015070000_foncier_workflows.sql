create table if not exists public.foncier_portal_access(
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.foncier_studies(id) on delete cascade,
  label text, recipient_email text, token_hash text unique not null, expires_at timestamptz not null,
  revoked_at timestamptz, last_accessed_at timestamptz, created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.foncier_dossier_access(
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.foncier_studies(id) on delete cascade,
  mode text not null check(mode in('teaser','full')), token_hash text unique not null, expires_at timestamptz not null,
  revoked_at timestamptz, last_accessed_at timestamptz, created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.foncier_study_timeline(
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.foncier_studies(id) on delete cascade,
  event_type text not null, title text not null, body text, event_at timestamptz not null default now(),
  visibility text not null default 'internal' check(visibility in('internal','owner')), created_by uuid references auth.users(id)
);
create table if not exists public.foncier_study_documents(
  id uuid primary key default gen_random_uuid(), study_id uuid not null references public.foncier_studies(id) on delete cascade,
  label text not null, storage_path text not null, category text, owner_visible boolean not null default false,
  created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.foncier_financial_scenarios(
  id uuid primary key default gen_random_uuid(), study_id uuid references public.foncier_studies(id) on delete cascade,
  name text not null, scenario_type text not null, assumptions jsonb not null default '{}', results jsonb not null default '{}',
  source_status text not null default 'hypothesis' check(source_status in('hypothesis','declared','verified','professional_validated')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.foncier_integration_outbox(
  id uuid primary key default gen_random_uuid(), destination text not null, event_type text not null, idempotency_key text unique not null,
  entity_type text not null, entity_id uuid, payload jsonb not null default '{}', status text not null default 'pending' check(status in('pending','processing','delivered','failed','dead')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(), last_error text,
  created_at timestamptz not null default now(), delivered_at timestamptz
);
alter table public.foncier_portal_access enable row level security;
alter table public.foncier_dossier_access enable row level security;
alter table public.foncier_study_timeline enable row level security;
alter table public.foncier_study_documents enable row level security;
alter table public.foncier_financial_scenarios enable row level security;
alter table public.foncier_integration_outbox enable row level security;
create policy "foncier admins portal access" on public.foncier_portal_access for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins dossier access" on public.foncier_dossier_access for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins timeline" on public.foncier_study_timeline for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins study documents" on public.foncier_study_documents for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins financial scenarios" on public.foncier_financial_scenarios for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create policy "foncier admins integration outbox" on public.foncier_integration_outbox for all to authenticated using(public.is_foncier_admin()) with check(public.is_foncier_admin());
create index if not exists foncier_portal_access_lookup on public.foncier_portal_access(token_hash,expires_at) where revoked_at is null;
create index if not exists foncier_dossier_access_lookup on public.foncier_dossier_access(token_hash,expires_at) where revoked_at is null;
create index if not exists foncier_timeline_study on public.foncier_study_timeline(study_id,event_at desc);
create index if not exists foncier_outbox_due on public.foncier_integration_outbox(status,next_attempt_at);
create or replace function public.claim_foncier_outbox(batch_size integer default 20) returns setof public.foncier_integration_outbox language plpgsql security definer set search_path=public as $$begin return query update public.foncier_integration_outbox o set status='processing',attempts=attempts+1 where o.id in(select id from public.foncier_integration_outbox where status in('pending','failed') and next_attempt_at<=now() order by created_at for update skip locked limit greatest(1,least(batch_size,100))) returning o.*;end$$;
revoke all on function public.claim_foncier_outbox(integer) from public,anon,authenticated;
grant execute on function public.claim_foncier_outbox(integer) to service_role;
create or replace function public.generate_foncier_due_followups() returns integer language plpgsql security definer set search_path=public as $$declare inserted integer;begin
  insert into public.foncier_activities(land_id,lead_id,kind,reason,body,due_at,metadata)
  select l.id,l.id,'scheduled_followup','Relance commerciale planifiée','Reprendre contact avec le propriétaire',l.next_follow_up,jsonb_build_object('generated',true)
  from public.foncier_land_leads l where l.next_follow_up is not null and l.next_follow_up<=now()+interval '24 hours'
  and not exists(select 1 from public.foncier_activities a where a.lead_id=l.id and a.kind='scheduled_followup' and a.completed_at is null and a.due_at=l.next_follow_up);
  get diagnostics inserted=row_count;return inserted;
end$$;
revoke all on function public.generate_foncier_due_followups() from public,anon,authenticated;
grant execute on function public.generate_foncier_due_followups() to service_role;
