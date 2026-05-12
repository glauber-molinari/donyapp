-- Profissionais de captação: tags (foto / vídeo / ambos).
alter table public.jobs
  add column if not exists professional_photo_tags text[] not null default '{}',
  add column if not exists professional_video_tags text[] not null default '{}';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jobs' and column_name = 'professional_name'
  ) then
    update public.jobs j
    set professional_photo_tags = coalesce(
      (
        select array_agg(left(trim(both from s.v), 80) order by s.ord)
        from (
          select token as v, ord
          from unnest(string_to_array(coalesce(j.professional_name, ''), ',')) with ordinality as u(token, ord)
          where trim(both from token) <> ''
          limit 20
        ) s
      ),
      '{}'::text[]
    )
    where j.professional_name is not null and length(trim(j.professional_name)) > 0;

    alter table public.jobs drop column professional_name;
  end if;
end $$;

comment on column public.jobs.professional_photo_tags is 'Quem fotografou (tags, múltiplos nomes).';
comment on column public.jobs.professional_video_tags is 'Quem filmou (tags, múltiplos nomes).';
