alter table public.visit_signature_requests
  add column if not exists email_attempts integer not null default 0 check (email_attempts >= 0),
  add column if not exists next_email_attempt_at timestamptz;

create index if not exists visit_signature_email_retry_idx
  on public.visit_signature_requests (next_email_attempt_at, created_at)
  where status in ('email_pending', 'email_error');

update public.visit_signature_requests
set next_email_attempt_at = now() + interval '35 minutes'
where status = 'email_error' and next_email_attempt_at is null;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'visit-signature-email-retry' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule(
    'visit-signature-email-retry',
    '7,42 * * * *',
    $command$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'foncier_function_base_url') || '/visit-signature/retry-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'foncier_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      );
    $command$
  );
end $$;
