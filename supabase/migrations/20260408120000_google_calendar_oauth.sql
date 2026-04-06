-- Google Calendar OAuth: tokens só via service role (RLS sem policies = negado a JWT; service_role ignora RLS).

create table public.account_google_calendar (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  google_email text,
  calendar_id text not null default 'primary',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index account_google_calendar_account_id_idx on public.account_google_calendar (account_id);

alter table public.account_google_calendar enable row level security;

create trigger account_google_calendar_set_updated_at
  before update on public.account_google_calendar
  for each row
  execute procedure public.set_updated_at ();

comment on table public.account_google_calendar is
  'Credenciais Google Calendar da conta (estúdio). Leitura/escrita apenas com SUPABASE_SERVICE_ROLE_KEY no servidor.';

alter table public.accounts drop column if exists google_calendar_embed_src;
