-- Ordem dos cards dentro de cada coluna do kanban (guia: position por etapa)
alter table public.jobs
  add column if not exists "position" integer not null default 0;

-- Backfill: ordenar por prazo e data de criação dentro de cada stage
update public.jobs j
set "position" = sub.pos
from (
  select
    id,
    row_number() over (
      partition by stage_id
      order by deadline asc, created_at asc
    ) - 1 as pos
  from public.jobs
  where stage_id is not null
) sub
where j.id = sub.id;

create index if not exists jobs_stage_id_position_idx on public.jobs (stage_id, "position");
