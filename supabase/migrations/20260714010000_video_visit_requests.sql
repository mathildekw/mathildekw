create extension if not exists pgcrypto;

create table if not exists public.video_visit_requests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid,
  property_reference text not null check (property_reference in ('979', '971', '888')),
  property_label text not null,
  video_path text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  project text,
  financing_status text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'signature_sent', 'signed', 'access_sent', 'rejected')),
  documenso_document_id text,
  documenso_recipient_id text,
  access_token_hash text,
  access_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  signed_at timestamptz,
  access_sent_at timestamptz
);

create table if not exists public.video_visit_invitations (
  id uuid primary key default gen_random_uuid(),
  property_reference text not null check (property_reference in ('979', '971', '888')),
  property_label text not null,
  invitation_type text not null default 'generic' check (invitation_type in ('generic', 'nominative')),
  token_hash text not null unique,
  prospect_full_name text,
  prospect_email text,
  prospect_phone text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  last_opened_at timestamptz
);

create index if not exists video_visit_requests_reference_idx on public.video_visit_requests (property_reference);
create index if not exists video_visit_requests_email_idx on public.video_visit_requests (lower(email));
create index if not exists video_visit_requests_documenso_document_idx on public.video_visit_requests (documenso_document_id);
create index if not exists video_visit_requests_status_idx on public.video_visit_requests (status);
create index if not exists video_visit_invitations_reference_idx on public.video_visit_invitations (property_reference);
create index if not exists video_visit_invitations_token_idx on public.video_visit_invitations (token_hash);
create index if not exists video_visit_invitations_expires_idx on public.video_visit_invitations (expires_at);

alter table public.video_visit_requests
  drop constraint if exists video_visit_requests_invitation_id_fkey,
  add constraint video_visit_requests_invitation_id_fkey
    foreign key (invitation_id) references public.video_visit_invitations(id);

alter table public.video_visit_requests enable row level security;
alter table public.video_visit_invitations enable row level security;

drop policy if exists "No browser access to video visit requests" on public.video_visit_requests;
create policy "No browser access to video visit requests"
on public.video_visit_requests
for all
using (false)
with check (false);

drop policy if exists "No browser access to video visit invitations" on public.video_visit_invitations;
create policy "No browser access to video visit invitations"
on public.video_visit_invitations
for all
using (false)
with check (false);
