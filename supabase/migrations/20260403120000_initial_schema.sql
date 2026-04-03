-- Donyapp — schema inicial (PRODUCT.md PASSO 2)
-- Executar no SQL Editor do Supabase ou via: supabase db push

-- -----------------------------------------------------------------------------
-- Extensões
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. accounts
-- -----------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now() not null
);

-- -----------------------------------------------------------------------------
-- 2. users (perfil; id = auth.users.id)
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  name text,
  email text,
  avatar_url text,
  role text default 'admin' not null check (role in ('admin', 'member')),
  tour_completed boolean default false not null,
  created_at timestamptz default now() not null
);

-- -----------------------------------------------------------------------------
-- 2b. account_members (PRODUCT — multi-usuário / equipe)
-- -----------------------------------------------------------------------------
create table public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now() not null,
  unique (account_id, user_id)
);

create index account_members_account_id_idx on public.account_members (account_id);
create index account_members_user_id_idx on public.account_members (user_id);

-- -----------------------------------------------------------------------------
-- 3. invitations
-- -----------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  email text not null,
  token text unique not null,
  role text default 'member' not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null
);

create index invitations_account_id_idx on public.invitations (account_id);
create index invitations_token_idx on public.invitations (token);

-- -----------------------------------------------------------------------------
-- 4. contacts
-- -----------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz default now() not null
);

create index contacts_account_id_idx on public.contacts (account_id);

-- -----------------------------------------------------------------------------
-- 5. kanban_stages
-- -----------------------------------------------------------------------------
create table public.kanban_stages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  position integer not null,
  color text not null,
  is_final boolean default false not null,
  created_at timestamptz default now() not null
);

create index kanban_stages_account_id_idx on public.kanban_stages (account_id);

-- -----------------------------------------------------------------------------
-- 6. jobs
-- -----------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  stage_id uuid references public.kanban_stages (id) on delete set null,
  name text not null,
  type text not null check (type in ('foto', 'video', 'foto_video')),
  deadline date not null,
  notes text,
  delivery_link text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index jobs_account_id_idx on public.jobs (account_id);
create index jobs_stage_id_idx on public.jobs (stage_id);

-- -----------------------------------------------------------------------------
-- 7. subscriptions
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  plan text default 'free' not null check (plan in ('free', 'pro')),
  status text default 'active' not null
    check (status in ('active', 'trialing', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  extra_users integer default 0 not null,
  asaas_subscription_id text,
  abacatepay_subscription_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index subscriptions_one_per_account_idx on public.subscriptions (account_id);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row
  execute procedure public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute procedure public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helpers RLS (SECURITY DEFINER; escopo por auth.uid())
-- -----------------------------------------------------------------------------
create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.account_id
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_account_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.role = 'admin' from public.users u where u.id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.accounts enable row level security;
alter table public.users enable row level security;
alter table public.account_members enable row level security;
alter table public.invitations enable row level security;
alter table public.contacts enable row level security;
alter table public.kanban_stages enable row level security;
alter table public.jobs enable row level security;
alter table public.subscriptions enable row level security;

-- accounts
create policy "accounts_select_member"
  on public.accounts for select
  to authenticated
  using (id = public.current_account_id());

create policy "accounts_insert_authenticated"
  on public.accounts for insert
  to authenticated
  with check (true);

create policy "accounts_update_admin"
  on public.accounts for update
  to authenticated
  using (id = public.current_account_id() and public.is_account_admin())
  with check (id = public.current_account_id());

-- users
create policy "users_select_self_or_teammates"
  on public.users for select
  to authenticated
  using (
    id = auth.uid()
    or account_id = public.current_account_id()
  );

create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "users_update_self_or_admin"
  on public.users for update
  to authenticated
  using (
    id = auth.uid()
    or (
      account_id = public.current_account_id()
      and public.is_account_admin()
    )
  )
  with check (
    id = auth.uid()
    or (
      account_id = public.current_account_id()
      and public.is_account_admin()
    )
  );

-- account_members
create policy "account_members_select"
  on public.account_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or account_id = public.current_account_id()
  );

create policy "account_members_insert_admin"
  on public.account_members for insert
  to authenticated
  with check (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

create policy "account_members_delete_admin"
  on public.account_members for delete
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

create policy "account_members_update_admin"
  on public.account_members for update
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  )
  with check (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

-- invitations
create policy "invitations_select_member"
  on public.invitations for select
  to authenticated
  using (account_id = public.current_account_id());

create policy "invitations_insert_admin"
  on public.invitations for insert
  to authenticated
  with check (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

create policy "invitations_update_admin"
  on public.invitations for update
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  )
  with check (account_id = public.current_account_id());

create policy "invitations_delete_admin"
  on public.invitations for delete
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

-- contacts
create policy "contacts_all_account"
  on public.contacts for all
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

-- kanban_stages
create policy "kanban_stages_select_account"
  on public.kanban_stages for select
  to authenticated
  using (account_id = public.current_account_id());

create policy "kanban_stages_write_admin"
  on public.kanban_stages for insert
  to authenticated
  with check (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

create policy "kanban_stages_update_admin"
  on public.kanban_stages for update
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  )
  with check (account_id = public.current_account_id());

create policy "kanban_stages_delete_admin"
  on public.kanban_stages for delete
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  );

-- jobs
create policy "jobs_all_account"
  on public.jobs for all
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

-- subscriptions
create policy "subscriptions_select_account"
  on public.subscriptions for select
  to authenticated
  using (account_id = public.current_account_id());

create policy "subscriptions_insert_account"
  on public.subscriptions for insert
  to authenticated
  with check (account_id = public.current_account_id());

create policy "subscriptions_update_admin"
  on public.subscriptions for update
  to authenticated
  using (
    account_id = public.current_account_id()
    and public.is_account_admin()
  )
  with check (account_id = public.current_account_id());

-- -----------------------------------------------------------------------------
-- Trigger: só admin altera role em users (evita auto-promoção)
-- -----------------------------------------------------------------------------
create or replace function public.users_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_account_admin() then
      raise exception 'apenas administradores podem alterar papéis';
    end if;
  end if;
  return new;
end;
$$;

create trigger users_enforce_role_change_trigger
  before update on public.users
  for each row
  execute procedure public.users_enforce_role_change();
