-- Nome livre de quem fotografou ou gravou (captação), preenchido no cadastro do job.
alter table public.jobs
  add column if not exists professional_name text;

comment on column public.jobs.professional_name is 'Nome de quem fotografou ou gravou o material (texto livre).';
