alter table public.foncier_funnel_events
  drop constraint if exists foncier_funnel_events_event_name_check;

alter table public.foncier_funnel_events
  add constraint foncier_funnel_events_event_name_check check(event_name in(
    'landing_view','cta_clicked','questionnaire_started','step_completed','parcel_selected',
    'contact_shared','questionnaire_completed','appointment_viewed','appointment_booked',
    'callback_requested','report_downloaded'
  ));

create or replace function public.foncier_conversion_metrics(date_from timestamptz default now()-interval '30 days')
returns jsonb language sql stable security definer set search_path=public as $$
with filtered as (
  select * from public.foncier_funnel_events where created_at>=date_from
), steps as (
  select coalesce((metadata->>'step')::integer,0) step,count(*) total
  from filtered where event_name='step_completed' group by 1 order by 1
)
select jsonb_build_object(
  'landing_views',count(*) filter(where event_name='landing_view'),
  'cta_clicks',count(*) filter(where event_name='cta_clicked'),
  'started',count(*) filter(where event_name='questionnaire_started'),
  'contact_shared',count(*) filter(where event_name='contact_shared'),
  'completed',count(*) filter(where event_name='questionnaire_completed'),
  'appointments',count(*) filter(where event_name='appointment_booked'),
  'callbacks',count(*) filter(where event_name='callback_requested'),
  'conversion_rate',case when count(*) filter(where event_name='questionnaire_started')=0 then 0 else round(100.0*count(*) filter(where event_name='questionnaire_completed')/count(*) filter(where event_name='questionnaire_started'),1) end,
  'step_completion',coalesce((select jsonb_object_agg(step,total) from steps),'{}'::jsonb),
  'by_source',coalesce((select jsonb_object_agg(traffic_source,total) from(select coalesce(traffic_source,'direct') traffic_source,count(*) total from filtered where event_name='landing_view' group by 1)s),'{}'::jsonb),
  'by_variant',coalesce((select jsonb_object_agg(ab_variant,data) from(select coalesce(ab_variant,'unknown') ab_variant,jsonb_build_object('views',count(*) filter(where event_name='landing_view'),'completed',count(*) filter(where event_name='questionnaire_completed')) data from filtered group by 1)v),'{}'::jsonb)
) from filtered
$$;

revoke all on function public.foncier_conversion_metrics(timestamptz) from public,anon;
grant execute on function public.foncier_conversion_metrics(timestamptz) to authenticated;
