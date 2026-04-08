-- Performance: índices para filtros comuns por conta no Kanban/Dashboard
-- Objetivo: reduzir scans e melhorar latência em listas/contagens por prazo/atualização/contato.

create index if not exists jobs_account_id_deadline_idx
  on public.jobs (account_id, deadline);

create index if not exists jobs_account_id_internal_deadline_idx
  on public.jobs (account_id, internal_deadline);

create index if not exists jobs_account_id_updated_at_idx
  on public.jobs (account_id, updated_at);

create index if not exists jobs_account_id_contact_id_idx
  on public.jobs (account_id, contact_id);

create index if not exists kanban_stages_account_id_is_final_idx
  on public.kanban_stages (account_id, is_final);

