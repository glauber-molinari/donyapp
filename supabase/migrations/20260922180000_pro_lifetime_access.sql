-- Pro vitalício (cortesia sem data de término) e controle do aviso de boas-vindas.

alter table public.subscriptions
  add column if not exists is_lifetime boolean not null default false;

alter table public.users
  add column if not exists lifetime_welcome_seen_at timestamptz;

comment on column public.subscriptions.is_lifetime is
  'Pro concedido sem data de término. O aviso de boas-vindas usa users.lifetime_welcome_seen_at.';

comment on column public.users.lifetime_welcome_seen_at is
  'Preenchido quando o usuário fecha o aviso de Pro vitalício.';
