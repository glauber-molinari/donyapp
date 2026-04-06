-- Número da alteração solicitada pelo cliente (0 = sem alteração neste ciclo), para acompanhamento no Kanban.
alter table public.jobs
  add column if not exists client_revision smallint not null default 0;

alter table public.jobs
  drop constraint if exists jobs_client_revision_range;

alter table public.jobs
  add constraint jobs_client_revision_range check (client_revision >= 0 and client_revision <= 5);
