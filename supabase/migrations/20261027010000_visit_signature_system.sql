create extension if not exists pgcrypto;

create table if not exists public.visit_signature_requests (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'tally',
  source_event_id text,
  source_submission_id text,
  property_reference text not null,
  property_label text not null,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  prospect_role text,
  project_description text,
  project_deadline text,
  prior_sale_required text,
  status text not null default 'email_pending'
    check (status in ('email_pending', 'email_sent', 'email_error', 'opened', 'signed', 'delivery_pending', 'delivered', 'rejected')),
  document_version text not null default 'visit-et1605-v1',
  document_payload jsonb not null default '{}'::jsonb,
  document_hash text not null,
  email_sent_at timestamptz,
  opened_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  consent_text text,
  signer_email text,
  signer_ip_hash text,
  signer_user_agent text,
  evidence_hash text,
  evidence_payload jsonb,
  certificate_storage_path text,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed', 'not_configured')),
  delivery_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists visit_signature_source_event_uidx
  on public.visit_signature_requests (source, source_event_id)
  where source_event_id is not null;
create index if not exists visit_signature_email_idx on public.visit_signature_requests (lower(email));
create index if not exists visit_signature_status_idx on public.visit_signature_requests (status, created_at desc);
create index if not exists visit_signature_property_idx on public.visit_signature_requests (property_reference, created_at desc);

alter table public.visit_signature_requests enable row level security;

drop policy if exists "No browser access to visit signature requests" on public.visit_signature_requests;
create policy "No browser access to visit signature requests"
on public.visit_signature_requests
for all
using (false)
with check (false);
revoke all on table public.visit_signature_requests from anon, authenticated;
grant all on table public.visit_signature_requests to service_role;

insert into storage.buckets (id, name, public)
values ('visit-certificates', 'visit-certificates', false)
on conflict (id) do update set public = false;

drop policy if exists "No browser access to visit certificates" on storage.objects;
create policy "No browser access to visit certificates"
on storage.objects
for all
using (false)
with check (false);
