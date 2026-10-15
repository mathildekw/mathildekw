create extension if not exists supabase_vault with schema vault;

create or replace function public.configure_foncier_prospecting_cron(function_base_url text, cron_secret text) returns jsonb language plpgsql security definer set search_path=public,vault,cron as $$declare url_id uuid;secret_id uuid;worker_job bigint;brief_job bigint;begin
  if coalesce(function_base_url,'')!~'^https://[a-z0-9-]+\.functions\.supabase\.co$' then raise exception 'URL Supabase Functions invalide';end if;
  if length(coalesce(cron_secret,''))<32 then raise exception 'Le secret cron doit contenir au moins 32 caractères';end if;
  select id into url_id from vault.secrets where name='foncier_function_base_url';
  if url_id is null then perform vault.create_secret(function_base_url,'foncier_function_base_url','URL des Edge Functions Foncier');else perform vault.update_secret(url_id,function_base_url,'foncier_function_base_url','URL des Edge Functions Foncier');end if;
  select id into secret_id from vault.secrets where name='foncier_cron_secret';
  if secret_id is null then perform vault.create_secret(cron_secret,'foncier_cron_secret','Secret du planificateur Foncier');else perform vault.update_secret(secret_id,cron_secret,'foncier_cron_secret','Secret du planificateur Foncier');end if;
  perform cron.unschedule(jobid) from cron.job where jobname in('foncier-prospecting-worker','foncier-weekly-briefing');
  select cron.schedule('foncier-prospecting-worker','*/5 * * * *',$command$select net.http_post(url:=(select decrypted_secret from vault.decrypted_secrets where name='foncier_function_base_url')||'/foncier-prospecting/cron/worker',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='foncier_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=55000);$command$) into worker_job;
  select cron.schedule('foncier-weekly-briefing','0 17 * * 1',$command$select net.http_post(url:=(select decrypted_secret from vault.decrypted_secrets where name='foncier_function_base_url')||'/foncier-prospecting/cron/weekly',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='foncier_cron_secret')),body:='{}'::jsonb,timeout_milliseconds:=55000);$command$) into brief_job;
  update public.foncier_settings set value=jsonb_set(jsonb_set(value,'{status}','"scheduled"'),'{schedule}','{"worker":"every 5 minutes","weekly_briefing":"Monday 07:00 Tahiti"}'),updated_at=now() where id='prospecting_engine';
  return jsonb_build_object('worker_job',worker_job,'briefing_job',brief_job,'timezone','UTC','weekly_tahiti_time','Monday 07:00');
end$$;
revoke all on function public.configure_foncier_prospecting_cron(text,text) from public,anon,authenticated;
