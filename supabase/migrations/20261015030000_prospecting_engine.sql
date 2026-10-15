create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table if not exists public.foncier_prospecting_sources(
  id text primary key,
  title text not null,
  service_url text not null,
  layer_id integer not null,
  attribution text not null,
  license_name text,
  license_url text,
  automated_reuse_allowed boolean not null default false,
  metadata_checked_at timestamptz not null,
  technical_limit integer not null default 2000,
  notes text,
  unique(service_url,layer_id)
);
insert into public.foncier_prospecting_sources values
('daf_parcels','Parcelles cadastrales de Polynésie','https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/CAD_parcelles_open/FeatureServer',0,'Direction des Affaires Foncières — Administration de la Polynésie française','Licence Ouverte Etalab 2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/',true,'2026-10-15T00:00:00Z',2000,'Surface publique indicative, distincte d’une contenance certifiée.'),
('daf_roads','BD topo — tronçons de route','https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/BD_carto_Polyn%C3%A9sie_Fran%C3%A7aise/FeatureServer',8,'Direction des Affaires Foncières — Administration de la Polynésie française','Licence Ouverte Etalab 2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/',true,'2026-10-15T00:00:00Z',2000,'Proximité cartographique uniquement ; ne prouve aucun accès juridique ou technique.'),
('daf_buildings','BD topo — bâtiments','https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/BD_carto_Polyn%C3%A9sie_Fran%C3%A7aise/FeatureServer',17,'Direction des Affaires Foncières — Administration de la Polynésie française','Licence Ouverte Etalab 2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/',true,'2026-10-15T00:00:00Z',2000,'Présence cartographique indicative.'),
('dca_pga','Vue PGA-PAD applicables','https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/Zonage_PGA_vue_test/FeatureServer',6,'Direction de la construction et de l’aménagement',null,null,false,'2026-10-15T00:00:00Z',2000,'Licence de réutilisation absente de la fiche ArcGIS : automatisation désactivée.'),
('dca_ppr','Aléa et zonage PPR','https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/Al%C3%A9a_et_zonage_PPR_public/FeatureServer',3,'Direction de la construction et de l’aménagement',null,null,false,'2026-10-15T00:00:00Z',2000,'Licence de réutilisation absente de la fiche ArcGIS : automatisation désactivée.')
on conflict(id) do update set title=excluded.title,service_url=excluded.service_url,attribution=excluded.attribution,license_name=excluded.license_name,automated_reuse_allowed=excluded.automated_reuse_allowed,metadata_checked_at=excluded.metadata_checked_at,technical_limit=excluded.technical_limit,notes=excluded.notes;

create table if not exists public.foncier_prospecting_searches(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commune text not null,
  active boolean not null default true,
  surface_min numeric not null default 0,
  surface_max numeric,
  road_distance_max_m numeric not null default 20,
  frontage_min_m numeric not null default 0,
  project_types text[] not null default '{}',
  cursor_offset integer not null default 0,
  run_state text not null default 'pending' check(run_state in('pending','running','complete','error','paused')),
  next_run_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_completed_at timestamptz,
  last_error text,
  criteria_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(commune,name)
);

create table if not exists public.foncier_parcel_cache(
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.foncier_prospecting_sources(id),
  source_object_id bigint not null,
  parcel_uid text,
  cadastral_reference text,
  commune text,
  associated_commune text,
  island text,
  cadastral_area numeric,
  geom extensions.geometry(MultiPolygon,4326) not null,
  source_attributes jsonb not null default '{}',
  source_hash text not null,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_analyzed_at timestamptz,
  unique(source_id,source_object_id)
);
create index if not exists foncier_parcel_geom_idx on public.foncier_parcel_cache using gist(geom);
create index if not exists foncier_parcel_filters_idx on public.foncier_parcel_cache(commune,cadastral_area);

create table if not exists public.foncier_road_cache(
  source_object_id bigint primary key,
  name text,
  classification text,
  nature text,
  geom extensions.geometry(MultiLineString,4326) not null,
  source_hash text not null,
  last_seen_at timestamptz not null default now()
);
create index if not exists foncier_road_geom_idx on public.foncier_road_cache using gist(geom);
create table if not exists public.foncier_building_cache(source_object_id bigint primary key,category integer,sub_category text,floors integer,height numeric,geom extensions.geometry(MultiPolygon,4326) not null,source_hash text not null,last_seen_at timestamptz not null default now());
create index if not exists foncier_building_geom_idx on public.foncier_building_cache using gist(geom);

alter table public.foncier_opportunities
  add column if not exists parcel_cache_id uuid references public.foncier_parcel_cache(id),
  add column if not exists prospecting_search_id uuid references public.foncier_prospecting_searches(id),
  add column if not exists priority_score integer check(priority_score between 0 and 100),
  add column if not exists score_explanation jsonb not null default '[]',
  add column if not exists road_distance_m numeric,
  add column if not exists frontage_indicative_m numeric,
  add column if not exists building_count integer,
  add column if not exists topography_status text not null default 'unavailable',
  add column if not exists pga_status text not null default 'to_verify',
  add column if not exists constraints_status text not null default 'to_verify',
  add column if not exists owner_research_status text not null default 'not_started',
  add column if not exists last_scored_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
alter table public.foncier_opportunities drop constraint if exists foncier_opportunities_status_check;
alter table public.foncier_opportunities add constraint foncier_opportunities_status_check check(status in('to_study','owner_to_identify','owner_identified','to_contact','contacted','appointment','mandate','dismissed')) not valid;
create unique index if not exists foncier_opportunity_parcel_cache_unique on public.foncier_opportunities(parcel_cache_id) where parcel_cache_id is not null;
create unique index if not exists foncier_notification_opportunity_unique on public.foncier_notifications(kind,entity_id) where kind='new_prospecting_opportunity';

create table if not exists public.foncier_opportunity_contacts(
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.foncier_opportunities(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  email text,
  postal_address text,
  acquisition_source text not null,
  source_details text,
  lawful_use_basis text not null,
  contact_authorized boolean not null default false,
  marketing_authorized boolean not null default false,
  objection_at timestamptz,
  do_not_contact boolean generated always as (objection_at is not null) stored,
  google_sheet_sync_status text not null default 'not_connected',
  google_sheet_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists foncier_contact_dedupe_email on public.foncier_opportunity_contacts(lower(email)) where email is not null;
create unique index if not exists foncier_contact_dedupe_phone on public.foncier_opportunity_contacts(regexp_replace(phone,'\D','','g')) where phone is not null;

create table if not exists public.foncier_prospecting_runs(
  id uuid primary key default gen_random_uuid(),
  search_id uuid references public.foncier_prospecting_searches(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  cursor_from integer,
  cursor_to integer,
  fetched_count integer not null default 0,
  changed_count integer not null default 0,
  opportunity_count integer not null default 0,
  error text,
  metadata jsonb not null default '{}'
);
create table if not exists public.foncier_weekly_briefings(id uuid primary key default gen_random_uuid(),week_start date not null unique,generated_at timestamptz not null default now(),new_opportunities integer not null default 0,priority_opportunities integer not null default 0,overdue_followups integer not null default 0,body jsonb not null default '{}',delivered_at timestamptz);
create table if not exists public.foncier_opportunity_matches(id uuid primary key default gen_random_uuid(),opportunity_id uuid not null references public.foncier_opportunities(id) on delete cascade,promoter_id uuid not null references public.foncier_promoters(id) on delete cascade,score integer not null check(score between 0 and 100),classification text not null,matched jsonb not null default '[]',to_verify jsonb not null default '[]',updated_at timestamptz not null default now(),unique(opportunity_id,promoter_id));
create table if not exists public.foncier_letter_templates(id text primary key,label text not null,subject text,body text not null,channel text not null check(channel in('letter','email','whatsapp','sms')),active boolean not null default true,updated_at timestamptz not null default now());
insert into public.foncier_letter_templates values('owner_first_letter','Premier courrier propriétaire','Votre parcelle à {{commune}}','Ia ora na {{prenom}},\n\nJe me permets de vous contacter au sujet d’une parcelle située à {{commune}}. Je souhaite simplement savoir si vous seriez disposé(e) à échanger sur vos projets éventuels pour ce terrain. Cette démarche ne présume ni de sa constructibilité ni d’un engagement de votre part.\n\nBien cordialement,\nMathilde TUDURI','letter',true,now()),('owner_followup','Relance après premier contact','Suite à mon message concernant votre terrain','Ia ora na {{prenom}},\n\nJe reviens vers vous concernant mon précédent message. Si le sujet n’est pas d’actualité, indiquez-le-moi simplement et je ne vous relancerai pas.\n\nMathilde TUDURI','email',true,now()) on conflict(id) do nothing;

alter table public.foncier_prospecting_sources enable row level security;alter table public.foncier_prospecting_searches enable row level security;alter table public.foncier_parcel_cache enable row level security;alter table public.foncier_road_cache enable row level security;alter table public.foncier_building_cache enable row level security;alter table public.foncier_opportunity_contacts enable row level security;alter table public.foncier_prospecting_runs enable row level security;alter table public.foncier_weekly_briefings enable row level security;alter table public.foncier_letter_templates enable row level security;
alter table public.foncier_opportunity_matches enable row level security;
create policy "admin prospecting sources" on public.foncier_prospecting_sources for select to authenticated using(true);create policy "admin prospecting searches" on public.foncier_prospecting_searches for all to authenticated using(true) with check(true);create policy "admin parcel cache" on public.foncier_parcel_cache for all to authenticated using(true) with check(true);create policy "admin road cache" on public.foncier_road_cache for all to authenticated using(true) with check(true);create policy "admin building cache" on public.foncier_building_cache for all to authenticated using(true) with check(true);create policy "admin opportunity contacts" on public.foncier_opportunity_contacts for all to authenticated using(true) with check(true);create policy "admin prospecting runs" on public.foncier_prospecting_runs for select to authenticated using(true);create policy "admin weekly briefs" on public.foncier_weekly_briefings for select to authenticated using(true);create policy "admin letter templates" on public.foncier_letter_templates for all to authenticated using(true) with check(true);
create policy "admin opportunity matches" on public.foncier_opportunity_matches for all to authenticated using(true) with check(true);

create or replace function public.claim_prospecting_search() returns public.foncier_prospecting_searches language plpgsql security definer set search_path=public as $$declare result public.foncier_prospecting_searches;begin select * into result from public.foncier_prospecting_searches where active and run_state<>'paused' and next_run_at<=now() order by next_run_at for update skip locked limit 1;if result.id is not null then update public.foncier_prospecting_searches set run_state='running',last_run_at=now(),last_error=null where id=result.id returning * into result;end if;return result;end$$;
revoke all on function public.claim_prospecting_search() from public,anon,authenticated;

create or replace function public.analyze_prospecting_search(target_search uuid) returns integer language plpgsql security definer set search_path=public,extensions as $$declare inserted_count integer:=0;begin
insert into public.foncier_opportunities(parcel_object_id,parcel_uid,cadastral_reference,commune,island,cadastral_area,geometry,source,parcel_cache_id,prospecting_search_id,status,road_distance_m,frontage_indicative_m,building_count,priority_score,score_explanation,potential_projects,topography_status,pga_status,constraints_status,last_scored_at)
select p.source_object_id,p.parcel_uid,p.cadastral_reference,p.commune,p.island,p.cadastral_area,st_asgeojson(p.geom)::jsonb,jsonb_build_object('source','daf_parcels','checked_at',p.last_seen_at,'license','Licence Ouverte Etalab 2.0'),p.id,s.id,'to_study',geo.road_distance,geo.frontage,buildings.count,
least(100,greatest(0,25+case when p.cadastral_area between s.surface_min and coalesce(s.surface_max,p.cadastral_area) then 25 else 0 end+case when geo.road_distance<=s.road_distance_max_m then 25 else 0 end+case when geo.frontage>=s.frontage_min_m then 15 else 0 end)),
jsonb_build_array(jsonb_build_object('criterion','surface','matched',p.cadastral_area between s.surface_min and coalesce(s.surface_max,p.cadastral_area),'value',p.cadastral_area),jsonb_build_object('criterion','route_proximity','matched',geo.road_distance<=s.road_distance_max_m,'value_m',round(geo.road_distance::numeric,1),'warning','Proximité cartographique, pas un accès juridique.'),jsonb_build_object('criterion','frontage_indicative','matched',geo.frontage>=s.frontage_min_m,'value_m',round(geo.frontage::numeric,1),'warning','Longueur géométrique indicative à confirmer.')),s.project_types,'unavailable','to_verify','to_verify',now()
from public.foncier_parcel_cache p join public.foncier_prospecting_searches s on s.id=target_search
cross join lateral(select coalesce(min(st_distance(p.geom::geography,r.geom::geography)),999999) road_distance,coalesce(st_length(st_intersection(st_boundary(p.geom),st_buffer(st_unaryunion(st_collect(r.geom))::geography,8)::geometry)::geography),0) frontage from public.foncier_road_cache r where st_dwithin(p.geom::geography,r.geom::geography,greatest(s.road_distance_max_m,30))) geo
cross join lateral(select count(*)::integer from public.foncier_building_cache b where st_intersects(p.geom,b.geom)) buildings
where upper(p.commune)=upper(s.commune) and p.cadastral_area>=s.surface_min and (s.surface_max is null or p.cadastral_area<=s.surface_max)
on conflict(parcel_cache_id) where parcel_cache_id is not null do update set road_distance_m=excluded.road_distance_m,frontage_indicative_m=excluded.frontage_indicative_m,building_count=excluded.building_count,priority_score=excluded.priority_score,score_explanation=excluded.score_explanation,prospecting_search_id=excluded.prospecting_search_id,last_scored_at=now(),updated_at=now();get diagnostics inserted_count=row_count;insert into public.foncier_notifications(kind,title,body,entity_type,entity_id) select 'new_prospecting_opportunity','Nouvelle opportunité foncière',coalesce(cadastral_reference,'Parcelle')||' · '||coalesce(commune,'Commune inconnue')||' · score '||coalesce(priority_score,0),'opportunity',id from public.foncier_opportunities where prospecting_search_id=target_search and created_at>=now()-interval '10 minutes' on conflict do nothing;update public.foncier_parcel_cache set last_analyzed_at=now() where upper(commune)=(select upper(commune) from public.foncier_prospecting_searches where id=target_search);return inserted_count;end$$;
revoke all on function public.analyze_prospecting_search(uuid) from public,anon,authenticated;

create or replace function public.refresh_opportunity_matches() returns integer language plpgsql security definer set search_path=public as $$declare total integer:=0;begin
insert into public.foncier_opportunity_matches(opportunity_id,promoter_id,score,classification,matched,to_verify,updated_at)
select o.id,p.id,least(100,
case when exists(select 1 from unnest(p.areas)a where lower(o.commune) like '%'||lower(a)||'%') then 35 else 0 end+
case when (p.surface_min is null or o.cadastral_area>=p.surface_min) and (p.surface_max is null or o.cadastral_area<=p.surface_max) then 25 else 0 end+
case when o.potential_projects&&p.project_types then 25 else 0 end+
case when o.road_distance_m<=20 then 10 else 0 end),
case when (case when exists(select 1 from unnest(p.areas)a where lower(o.commune) like '%'||lower(a)||'%') then 35 else 0 end+case when (p.surface_min is null or o.cadastral_area>=p.surface_min) and (p.surface_max is null or o.cadastral_area<=p.surface_max) then 25 else 0 end+case when o.potential_projects&&p.project_types then 25 else 0 end+case when o.road_distance_m<=20 then 10 else 0 end)>=75 then 'strong' when (case when exists(select 1 from unnest(p.areas)a where lower(o.commune) like '%'||lower(a)||'%') then 35 else 0 end+case when (p.surface_min is null or o.cadastral_area>=p.surface_min) and (p.surface_max is null or o.cadastral_area<=p.surface_max) then 25 else 0 end+case when o.potential_projects&&p.project_types then 25 else 0 end+case when o.road_distance_m<=20 then 10 else 0 end)>=45 then 'partial' else 'insufficient_data' end,
jsonb_build_array(case when exists(select 1 from unnest(p.areas)a where lower(o.commune) like '%'||lower(a)||'%') then 'Localisation' end,case when (p.surface_min is null or o.cadastral_area>=p.surface_min) and (p.surface_max is null or o.cadastral_area<=p.surface_max) then 'Surface' end,case when o.potential_projects&&p.project_types then 'Typologie' end),
jsonb_build_array('Prix du terrain','Accès juridique','Urbanisme et faisabilité'),now()
from public.foncier_opportunities o cross join public.foncier_promoters p where o.status not in('dismissed','mandate') and p.status='active'
on conflict(opportunity_id,promoter_id) do update set score=excluded.score,classification=excluded.classification,matched=excluded.matched,to_verify=excluded.to_verify,updated_at=now();get diagnostics total=row_count;return total;end$$;
revoke all on function public.refresh_opportunity_matches() from public,anon,authenticated;

create or replace function public.generate_foncier_weekly_briefing() returns uuid language plpgsql security definer set search_path=public as $$declare result_id uuid;start_date date:=date_trunc('week',now())::date;begin insert into public.foncier_weekly_briefings(week_start,new_opportunities,priority_opportunities,overdue_followups,body) select start_date,count(*) filter(where o.created_at>=start_date),count(*) filter(where o.priority_score>=70 and o.status not in('dismissed','mandate')), (select count(*) from public.foncier_activities where completed_at is null and due_at<now()),jsonb_build_object('top_opportunities',coalesce((select jsonb_agg(x) from(select id,cadastral_reference,commune,cadastral_area,priority_score,status from public.foncier_opportunities where status not in('dismissed','mandate') order by priority_score desc nulls last limit 10)x),'[]'::jsonb),'actions',coalesce((select jsonb_agg(x) from(select id,kind,body,due_at from public.foncier_activities where completed_at is null order by due_at nulls last limit 15)x),'[]'::jsonb)) from public.foncier_opportunities o on conflict(week_start) do update set generated_at=now(),new_opportunities=excluded.new_opportunities,priority_opportunities=excluded.priority_opportunities,overdue_followups=excluded.overdue_followups,body=excluded.body returning id into result_id;return result_id;end$$;
revoke all on function public.generate_foncier_weekly_briefing() from public,anon,authenticated;

insert into public.foncier_settings(id,value) values('prospecting_engine','{"status":"not_scheduled","batch_size":200,"weekly_day":"monday","sources":["daf_parcels","daf_roads","daf_buildings"],"pga":"disabled_license_unconfirmed","ppr":"disabled_license_unconfirmed"}'::jsonb) on conflict(id) do nothing;
