alter table public.foncier_funnel_events
  drop constraint if exists foncier_funnel_events_event_name_check;

alter table public.foncier_funnel_events
  add constraint foncier_funnel_events_event_name_check check(event_name in(
    'page_view','landing_view','cta_clicked','questionnaire_started','step_completed','parcel_selected',
    'contact_shared','questionnaire_completed','appointment_viewed','appointment_booked',
    'callback_requested','report_downloaded','scroll_depth','engagement_time','menu_open',
    'whatsapp_click','phone_click','property_click','estimate_click','diagnostic_click','filter_used'
  ));

create or replace function public.foncier_conversion_metrics(date_from timestamptz default now()-interval '30 days')
returns jsonb language sql stable security definer set search_path=public as $$
with filtered as (
  select * from public.foncier_funnel_events where created_at>=date_from
), steps as (
  select coalesce((metadata->>'step')::integer,0) step,count(*) total
  from filtered where event_name='step_completed' group by 1 order by 1
), pages as (
  select coalesce(page_path,'inconnue') page,
    count(*) filter(where event_name='page_view') views,
    count(distinct session_id) sessions,
    coalesce(sum(case when event_name='engagement_time' then greatest(0,least(1800,coalesce((metadata->>'seconds')::integer,0))) else 0 end),0) engaged_seconds
  from filtered where event_name in('page_view','engagement_time') group by 1 order by views desc limit 25
), sources as (
  select coalesce(traffic_source,'direct') source,
    count(distinct session_id) sessions,
    count(*) filter(where event_name='questionnaire_completed') leads,
    count(*) filter(where event_name='appointment_booked') appointments
  from filtered group by 1 order by sessions desc
), devices as (
  select coalesce(metadata->>'device','unknown') device,count(distinct session_id) sessions
  from filtered where event_name='page_view' group by 1
), scrolls as (
  select coalesce((metadata->>'percent')::integer,0) depth,count(distinct session_id) sessions
  from filtered where event_name='scroll_depth' group by 1 order by 1
)
select jsonb_build_object(
  'sessions',count(distinct session_id) filter(where event_name='page_view'),
  'page_views',count(*) filter(where event_name='page_view'),
  'engaged_seconds',coalesce(sum(case when event_name='engagement_time' then greatest(0,least(1800,coalesce((metadata->>'seconds')::integer,0))) else 0 end),0),
  'landing_views',count(*) filter(where event_name='landing_view'),
  'cta_clicks',count(*) filter(where event_name='cta_clicked'),
  'started',count(*) filter(where event_name='questionnaire_started'),
  'contact_shared',count(*) filter(where event_name='contact_shared'),
  'completed',count(*) filter(where event_name='questionnaire_completed'),
  'appointments',count(*) filter(where event_name='appointment_booked'),
  'callbacks',count(*) filter(where event_name='callback_requested'),
  'conversion_rate',case when count(*) filter(where event_name='questionnaire_started')=0 then 0 else round(100.0*count(*) filter(where event_name='questionnaire_completed')/count(*) filter(where event_name='questionnaire_started'),1) end,
  'step_completion',coalesce((select jsonb_object_agg(step,total) from steps),'{}'::jsonb),
  'top_pages',coalesce((select jsonb_agg(jsonb_build_object('page',page,'views',views,'sessions',sessions,'engaged_seconds',engaged_seconds)) from pages),'[]'::jsonb),
  'by_source',coalesce((select jsonb_object_agg(source,jsonb_build_object('sessions',sessions,'leads',leads,'appointments',appointments)) from sources),'{}'::jsonb),
  'by_device',coalesce((select jsonb_object_agg(device,sessions) from devices),'{}'::jsonb),
  'scroll_depth',coalesce((select jsonb_object_agg(depth,sessions) from scrolls),'{}'::jsonb),
  'by_variant',coalesce((select jsonb_object_agg(ab_variant,data) from(select coalesce(ab_variant,'unknown') ab_variant,jsonb_build_object('views',count(*) filter(where event_name='landing_view'),'completed',count(*) filter(where event_name='questionnaire_completed')) data from filtered group by 1)v),'{}'::jsonb)
) from filtered
$$;

revoke all on function public.foncier_conversion_metrics(timestamptz) from public,anon;
grant execute on function public.foncier_conversion_metrics(timestamptz) to authenticated;

insert into public.foncier_settings(id,value) values(
  'analytics',
  '{"status":"active_first_party","consent_required":true,"session_recording":false,"form_values_collected":false,"private_routes_excluded":true,"retention_months":24}'::jsonb
) on conflict(id) do update set value=excluded.value;

-- The end-to-end validation performed on 2026-10-16 confirmed that the
-- configured webhook writes idempotently to the authorised "Suivi KW Impact"
-- spreadsheet. Keep the public dashboard honest about the remaining channel:
-- internal notifications work, while no external notification provider exists.
insert into public.foncier_settings(id,value) values
  ('google_sheets','{"status":"connected","sheet_name":"Suivi KW Impact","role":"secondary_commercial_register","source_of_truth":"supabase","deduplication":"enabled","retry_queue":"enabled","verified_at":"2026-10-16"}'::jsonb),
  ('notifications','{"internal":"active","priority_alerts":"active","overdue_reminders":"active","external":"not_configured"}'::jsonb)
on conflict(id) do update set value=excluded.value;
