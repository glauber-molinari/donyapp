-- Responsáveis manuais (Pro, conta com um único usuário): diretório local para exibir no Kanban
-- sem convites na equipe. Referenciado por jobs.photo_manual_assignee_id / video_manual_assignee_id.

create table public.manual_job_assignees (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  email text not null,
  photo_url text,
  position integer not null default 0,
  created_at timestamptz default now() not null
);

create index manual_job_assignees_account_id_idx on public.manual_job_assignees (account_id);

alter table public.jobs
  add column if not exists photo_manual_assignee_id uuid null references public.manual_job_assignees (id) on delete set null,
  add column if not exists video_manual_assignee_id uuid null references public.manual_job_assignees (id) on delete set null;

create index if not exists jobs_photo_manual_assignee_id_idx on public.jobs (photo_manual_assignee_id);
create index if not exists jobs_video_manual_assignee_id_idx on public.jobs (video_manual_assignee_id);

alter table public.manual_job_assignees enable row level security;

create policy "manual_job_assignees_all_account"
  on public.manual_job_assignees for all
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());
