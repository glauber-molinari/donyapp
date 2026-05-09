-- Task enhancements: new columns, assignees, comments, subtasks

-- ─── 1. Novos campos na tabela tasks ────────────────────────────────────────

alter table public.tasks
  add column if not exists description text,
  add column if not exists type text not null default 'tarefa'
    check (type in ('tarefa', 'sessao', 'edicao', 'revisao', 'entrega')),
  add column if not exists start_date date,
  add column if not exists subtasks jsonb not null default '[]'::jsonb;

-- ─── 2. task_assignees ───────────────────────────────────────────────────────

create table if not exists public.task_assignees (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.tasks (id) on delete cascade,
  account_id  uuid        not null references public.accounts (id) on delete cascade,
  name        text        not null,
  email       text        not null,
  user_id     uuid        references public.users (id) on delete set null,
  avatar_url  text,
  invited_at  timestamptz not null default now(),
  unique (task_id, email)
);

create index if not exists task_assignees_task_id_idx    on public.task_assignees (task_id);
create index if not exists task_assignees_account_id_idx on public.task_assignees (account_id);

alter table public.task_assignees enable row level security;

create policy "task_assignees_account_isolate" on public.task_assignees
  for all to authenticated
  using  (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

-- ─── 3. task_comments ────────────────────────────────────────────────────────

create table if not exists public.task_comments (
  id          uuid        primary key default gen_random_uuid(),
  task_id     uuid        not null references public.tasks (id) on delete cascade,
  account_id  uuid        not null references public.accounts (id) on delete cascade,
  user_id     uuid        not null references public.users (id) on delete cascade,
  user_name   text        not null,
  user_avatar text,
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx    on public.task_comments (task_id);
create index if not exists task_comments_account_id_idx on public.task_comments (account_id);

alter table public.task_comments enable row level security;

create policy "task_comments_account_isolate" on public.task_comments
  for all to authenticated
  using  (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());
