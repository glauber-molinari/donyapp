-- Tags livres para identificar cartões SD usados no trabalho (ex.: 001, CARTÃO 1).

alter table public.jobs
  add column if not exists sd_card_tags text[] not null default '{}';

comment on column public.jobs.sd_card_tags is 'Identificadores de cartão SD usados na sessão (texto livre, múltiplos valores).';
