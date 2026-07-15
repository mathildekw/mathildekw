alter table public.video_visit_requests
  drop constraint if exists video_visit_requests_status_check;

alter table public.video_visit_requests
  add constraint video_visit_requests_status_check
  check (status in ('pending', 'signature_sent', 'signature_error', 'signed', 'access_sent', 'rejected'));
