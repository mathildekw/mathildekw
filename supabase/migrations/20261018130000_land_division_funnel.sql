-- Non-destructive extension of the existing Foncier CRM for the land-division funnel.
-- No customer data, cadastral geometry or privileged credential is seeded.

alter table public.foncier_land_leads
  add column if not exists lead_type text not null default 'general_land',
  add column if not exists division_project jsonb not null default '{}'::jsonb;

create index if not exists foncier_land_leads_type_created_idx
  on public.foncier_land_leads (lead_type, created_at desc);

comment on column public.foncier_land_leads.lead_type is
  'Commercial journey identifier. division_land identifies the division funnel; it is not a feasibility status.';
comment on column public.foncier_land_leads.division_project is
  'Owner-declared division objectives and unknowns. Never a regulatory or surveyor validation.';

-- Existing RLS remains unchanged: public clients still write only through Edge Functions,
-- and authenticated reads continue to require the existing administrator checks.
