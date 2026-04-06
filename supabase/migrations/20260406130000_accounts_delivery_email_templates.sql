-- Templates padrão de e-mail de entrega (conta) — Configurações → E-mail (Pro)

alter table public.accounts
  add column if not exists delivery_email_subject_template text;

alter table public.accounts
  add column if not exists delivery_email_body_template text;

comment on column public.accounts.delivery_email_subject_template is
  'Assunto padrão do e-mail de material ao cliente; placeholders {{nome_cliente}}, {{nome_job}}, {{link_material}}, {{nome_remetente}}';

comment on column public.accounts.delivery_email_body_template is
  'Corpo padrão (texto) do e-mail de material; mesmos placeholders.';
