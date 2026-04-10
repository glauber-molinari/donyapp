-- Notas de cliente (e opcionalmente de job)

create table public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  title text,
  content text not null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index contact_notes_account_id_created_at_idx
  on public.contact_notes (account_id, created_at desc);
create index contact_notes_contact_id_idx on public.contact_notes (contact_id);
create index contact_notes_job_id_idx on public.contact_notes (job_id);

create trigger contact_notes_set_updated_at
  before update on public.contact_notes
  for each row
  execute procedure public.set_updated_at();

alter table public.contact_notes enable row level security;

create policy "contact_notes_all_account"
  on public.contact_notes for all
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

