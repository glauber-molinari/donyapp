-- Tipos de trabalho por conta + prazo interno + vínculo com job pai (card de edição de vídeo).

create table public.job_work_types (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  "position" integer not null default 0,
  created_at timestamptz default now() not null
);

create index job_work_types_account_id_idx on public.job_work_types (account_id);

alter table public.jobs
  add column internal_deadline date,
  add column work_type_id uuid references public.job_work_types (id) on delete restrict,
  add column parent_job_id uuid references public.jobs (id) on delete cascade,
  add column job_kind text not null default 'standard'
    check (job_kind in ('standard', 'video_edit'));

update public.jobs set internal_deadline = deadline where internal_deadline is null;

alter table public.jobs alter column internal_deadline set not null;

insert into public.job_work_types (account_id, name, "position")
select a.id, 'Geral', 1
from public.accounts a
where not exists (
  select 1 from public.job_work_types j where j.account_id = a.id
);

update public.jobs j
set work_type_id = (
  select jwt.id
  from public.job_work_types jwt
  where jwt.account_id = j.account_id
  order by jwt."position", jwt.created_at
  limit 1
)
where j.work_type_id is null;

alter table public.jobs alter column work_type_id set not null;

alter table public.job_work_types enable row level security;

create policy "job_work_types_select_account"
  on public.job_work_types for select
  to authenticated
  using (account_id = public.current_account_id());

create policy "job_work_types_insert_admin"
  on public.job_work_types for insert
  to authenticated
  with check (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

create policy "job_work_types_update_admin"
  on public.job_work_types for update
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  )
  with check (account_id = public.current_account_id());

create policy "job_work_types_delete_admin"
  on public.job_work_types for delete
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );
