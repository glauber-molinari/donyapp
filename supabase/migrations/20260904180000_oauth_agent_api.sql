-- OAuth 2.0 clients and tokens for the public Agent API (authorization code + PKCE).
-- No private job/contact data is exposed via these tokens; scopes are profile/account only.

create table if not exists public.oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_secret_hash text,
  client_name text,
  redirect_uris text[] not null,
  grant_types text[] not null default array['authorization_code', 'refresh_token']::text[],
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default now()
);

create table if not exists public.oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null,
  redirect_uri text not null,
  scopes text[] not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_authorization_codes_client_id_idx
  on public.oauth_authorization_codes (client_id);

create table if not exists public.oauth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null,
  scopes text[] not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_refresh_tokens_client_id_idx
  on public.oauth_refresh_tokens (client_id);

alter table public.oauth_clients enable row level security;
alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_refresh_tokens enable row level security;

-- Access only via service role from Next.js route handlers. No policies for anon/authenticated.
