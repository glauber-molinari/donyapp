-- Tabela de tarefas do planner diário (feature PRO)
create table public.tasks (
  id         uuid        primary key default gen_random_uuid(),
  account_id uuid        not null references public.accounts (id) on delete cascade,
  created_by uuid        not null references auth.users (id),
  name       text        not null,
  priority   text        not null check (priority in ('baixa', 'media', 'alta')),
  deadline   date        not null,
  notes      text,
  status     text        not null default 'para_fazer'
               check (status in ('para_fazer', 'iniciado', 'feito')),
  position   integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.tasks.priority is 'Prioridade da tarefa: baixa, media ou alta';
comment on column public.tasks.status   is 'Coluna do kanban: para_fazer, iniciado ou feito';
comment on column public.tasks.position is 'Ordem dentro da coluna (status) para o kanban';

create index tasks_account_id_idx on public.tasks (account_id);

alter table public.tasks enable row level security;

create policy "tasks_all_account" on public.tasks
  for all to authenticated
  using  (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();
