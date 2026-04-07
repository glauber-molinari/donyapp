-- Data de referência do job (ex.: data do evento/serviço), opcional.
alter table public.jobs
  add column if not exists job_date date;

comment on column public.jobs.job_date is 'Data do serviço ou evento (referência do job).';
