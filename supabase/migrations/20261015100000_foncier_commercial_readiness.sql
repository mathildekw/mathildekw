-- Commercial hardening for the Foncier funnel. No customer data is seeded.

alter table public.foncier_land_leads
  add column if not exists phone_normalized text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored,
  add column if not exists email_normalized text generated always as (lower(nullif(btrim(email), ''))) stored,
  add column if not exists last_submission_hash text,
  add column if not exists last_submission_at timestamptz;

create index if not exists foncier_land_phone_normalized_idx
  on public.foncier_land_leads (phone_normalized);

create index if not exists foncier_land_email_normalized_idx
  on public.foncier_land_leads (email_normalized)
  where email_normalized is not null;

create index if not exists foncier_land_followup_due_idx
  on public.foncier_land_leads (next_follow_up, priority_level)
  where next_follow_up is not null
    and pipeline not in ('sold', 'abandoned', 'not_relevant');

create or replace function public.generate_foncier_due_followups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  insert into public.foncier_activities(
    land_id, lead_id, kind, reason, body, due_at, metadata
  )
  select
    l.id,
    l.id,
    'scheduled_followup',
    'Relance commerciale planifiée',
    coalesce(nullif(l.next_action, ''), 'Reprendre contact avec le propriétaire'),
    l.next_follow_up,
    jsonb_build_object('generated', true, 'priority', l.priority_level)
  from public.foncier_land_leads l
  where l.next_follow_up is not null
    and l.next_follow_up <= now() + interval '24 hours'
    and l.pipeline not in ('sold', 'abandoned', 'not_relevant')
    and not exists (
      select 1
      from public.foncier_activities a
      where a.lead_id = l.id
        and a.kind = 'scheduled_followup'
        and a.completed_at is null
        and a.due_at = l.next_follow_up
    );
  get diagnostics inserted = row_count;

  insert into public.foncier_notifications(kind, title, body, entity_type, entity_id)
  select
    'followup_due',
    case when l.priority_level = 'P1' then 'Relance prioritaire à effectuer' else 'Relance foncière à effectuer' end,
    l.reference || ' · ' || l.commune || ' · ' || coalesce(nullif(l.next_action, ''), 'Reprendre contact'),
    'land',
    l.id
  from public.foncier_land_leads l
  where l.next_follow_up is not null
    and l.next_follow_up <= now() + interval '24 hours'
    and l.pipeline not in ('sold', 'abandoned', 'not_relevant')
    and not exists (
      select 1 from public.foncier_notifications n
      where n.kind = 'followup_due'
        and n.entity_id = l.id
        and n.created_at >= l.next_follow_up - interval '24 hours'
    );

  return inserted;
end
$$;

revoke all on function public.generate_foncier_due_followups() from public, anon, authenticated;
grant execute on function public.generate_foncier_due_followups() to service_role;

create or replace function public.foncier_appointment_updates_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' then
    update public.foncier_land_leads
      set pipeline = 'appointment',
          next_action = 'Préparer le rendez-vous foncier',
          next_follow_up = new.start_at,
          updated_at = now()
      where id = new.lead_id;

    insert into public.foncier_activities(
      land_id, lead_id, kind, reason, body, due_at, metadata
    ) values (
      new.lead_id,
      new.lead_id,
      'appointment_booked',
      'Rendez-vous confirmé',
      'Préparer le rendez-vous · ' || new.mode,
      new.start_at,
      jsonb_build_object('appointment_id', new.id, 'timezone', new.timezone)
    );
  end if;
  return new;
end
$$;

drop trigger if exists foncier_appointment_updates_crm on public.foncier_appointments;
create trigger foncier_appointment_updates_crm
after insert or update of status on public.foncier_appointments
for each row execute function public.foncier_appointment_updates_crm();

insert into public.foncier_settings(id, value)
values (
  'google_sheets',
  jsonb_build_object(
    'status', 'awaiting_webhook',
    'sheet_name', 'Suivi KW Impact',
    'spreadsheet_id', '1uNmxR1H9cj_CuHE_sQxCqB_K4PqQfGonIhvr4WTCzqE',
    'target_tab', 'Journal',
    'dedupe_key', 'Supabase lead UUID',
    'source_of_truth', 'Supabase',
    'columns', jsonb_build_array(
      'DATE', 'MOMENT', 'CONTACT', 'INFO BIEN / PROJET', 'TÉL / EMAIL',
      'CAT.', 'SOURCE', 'STATUT LEAD', 'RÉSULTAT', 'PRIX / BUDGET (XPF)',
      'PROCHAINE ACTION', 'RELANCE LE', 'INVIT'' RÉSEAUX', 'RECO OBTENUE',
      'NOTES', 'SUIVI / ANGLE RELANCE'
    )
  )
)
on conflict(id) do update set value = excluded.value;

create or replace function public.configure_foncier_commercial_cron(function_base_url text, cron_secret text)
returns bigint
language plpgsql
security definer
set search_path = public, vault, cron
as $$
declare
  url_id uuid;
  secret_id uuid;
  job_id bigint;
begin
  if length(coalesce(cron_secret, '')) < 32 then
    raise exception 'Le secret cron doit contenir au moins 32 caractères';
  end if;
  if function_base_url !~ '^https://[a-z0-9-]+\.functions\.supabase\.co$' then
    raise exception 'URL Supabase Functions invalide';
  end if;

  select id into url_id from vault.secrets where name = 'foncier_commercial_function_base_url';
  if url_id is null then
    perform vault.create_secret(function_base_url, 'foncier_commercial_function_base_url', 'Base URL maintenance commerciale');
  else
    perform vault.update_secret(url_id, function_base_url, 'foncier_commercial_function_base_url');
  end if;

  select id into secret_id from vault.secrets where name = 'foncier_commercial_cron_secret';
  if secret_id is null then
    perform vault.create_secret(cron_secret, 'foncier_commercial_cron_secret', 'Secret maintenance commerciale');
  else
    perform vault.update_secret(secret_id, cron_secret, 'foncier_commercial_cron_secret');
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'foncier-commercial-maintenance';
  select cron.schedule(
    'foncier-commercial-maintenance',
    '*/15 * * * *',
    $command$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name='foncier_commercial_function_base_url') || '/foncier-maintenance',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name='foncier_commercial_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
      );
    $command$
  ) into job_id;
  return job_id;
end
$$;

revoke all on function public.configure_foncier_commercial_cron(text, text) from public, anon, authenticated;

-- Bootstrap is restricted to the SHA-256 fingerprint of the administrator's
-- email. The email itself is not stored in the repository or exposed publicly.
insert into public.foncier_settings(id, value)
values ('admin_bootstrap', '{"email_sha256":"2e83bc2552c35619816117380cd0f314de0ae777c45f4e91dad194cb6e85ad22"}'::jsonb)
on conflict(id) do update set value = excluded.value;

create or replace function public.bootstrap_foncier_admin()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  expected_hash text;
  actual_hash text;
begin
  select value->>'email_sha256' into expected_hash
  from public.foncier_settings where id = 'admin_bootstrap';
  actual_hash := encode(extensions.digest(lower(coalesce(new.email, '')), 'sha256'), 'hex');
  if expected_hash is not null and actual_hash = expected_hash then
    insert into public.foncier_admin_users(user_id, created_by, active, role)
    values(new.id, new.id, true, 'admin')
    on conflict(user_id) do update set active = true, role = 'admin';
  end if;
  return new;
end
$$;

drop trigger if exists foncier_admin_bootstrap on auth.users;
create trigger foncier_admin_bootstrap
after insert or update of email on auth.users
for each row execute function public.bootstrap_foncier_admin();
