create table if not exists public.public_form_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null,
  source text not null,
  contact_name text,
  phone text,
  email text,
  payload jsonb not null default '{}'::jsonb,
  sheet_status text not null default 'pending',
  sheet_error text
);

alter table public.public_form_submissions enable row level security;
revoke all on public.public_form_submissions from anon, authenticated;
