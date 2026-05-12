-- Múltiplos responsáveis por job (foto / vídeo), misturando usuários da conta e responsáveis manuais.

create table if not exists public.job_assignees (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  manual_job_assignee_id uuid references public.manual_job_assignees (id) on delete cascade,
  role text not null check (role in ('photo', 'video')),
  created_at timestamptz not null default now(),
  constraint job_assignees_one_target check (
    (user_id is not null and manual_job_assignee_id is null)
    or (user_id is null and manual_job_assignee_id is not null)
  )
);

create unique index if not exists job_assignees_job_user_role_uidx
  on public.job_assignees (job_id, user_id, role)
  where user_id is not null;

create unique index if not exists job_assignees_job_manual_role_uidx
  on public.job_assignees (job_id, manual_job_assignee_id, role)
  where manual_job_assignee_id is not null;

create index if not exists job_assignees_job_id_idx on public.job_assignees (job_id);

alter table public.job_assignees enable row level security;

create policy "job_assignees_all_account"
  on public.job_assignees for all
  to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_assignees.job_id
        and j.account_id = public.current_account_id()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = job_assignees.job_id
        and j.account_id = public.current_account_id()
    )
  );

-- Migração a partir dos campos legados (um responsável por papel).
insert into public.job_assignees (job_id, user_id, manual_job_assignee_id, role)
select j.id, j.photo_editor_id, null, 'photo'
from public.jobs j
where j.photo_editor_id is not null
  and not exists (
    select 1 from public.job_assignees ja
    where ja.job_id = j.id and ja.user_id = j.photo_editor_id and ja.role = 'photo'
  );

insert into public.job_assignees (job_id, user_id, manual_job_assignee_id, role)
select j.id, null, j.photo_manual_assignee_id, 'photo'
from public.jobs j
where j.photo_manual_assignee_id is not null
  and not exists (
    select 1 from public.job_assignees ja
    where ja.job_id = j.id and ja.manual_job_assignee_id = j.photo_manual_assignee_id and ja.role = 'photo'
  );

insert into public.job_assignees (job_id, user_id, manual_job_assignee_id, role)
select j.id, j.video_editor_id, null, 'video'
from public.jobs j
where j.video_editor_id is not null
  and not exists (
    select 1 from public.job_assignees ja
    where ja.job_id = j.id and ja.user_id = j.video_editor_id and ja.role = 'video'
  );

insert into public.job_assignees (job_id, user_id, manual_job_assignee_id, role)
select j.id, null, j.video_manual_assignee_id, 'video'
from public.jobs j
where j.video_manual_assignee_id is not null
  and not exists (
    select 1 from public.job_assignees ja
    where ja.job_id = j.id and ja.manual_job_assignee_id = j.video_manual_assignee_id and ja.role = 'video'
  );
