-- Cancelamento de assinatura: mantém Pro até current_period_ends_at; não renova após inativar no Asaas.
alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.subscriptions.cancel_at_period_end is
  'Usuário pediu cancelamento: Pro até o fim do período pago; após isso volta ao Free (cron/webhook).';
