-- Marketing mocks (reversível)
-- Tudo inserido por este seed é marcado com o token abaixo para remoção fácil.
-- Remoção: execute supabase/seed/remove-marketing-mocks.sql

-- Token de rastreio (mude se quiser gerar outro lote)
-- Mantido em uma CTE para reutilização.
with const as (
  select 'MOCK_MARKETING_2026_04_07'::text as token
),
accounts_to_seed as (
  select a.id as account_id
  from public.accounts a
),
account_owner as (
  -- Melhor "owner" disponível por conta: admin primeiro, senão o mais antigo.
  select
    a.account_id,
    coalesce(
      (select u.id from public.users u where u.account_id = a.account_id and u.role = 'admin' order by u.created_at asc limit 1),
      (select u.id from public.users u where u.account_id = a.account_id order by u.created_at asc limit 1)
    ) as user_id
  from accounts_to_seed a
),
work_type as (
  -- Tipo de trabalho padrão por conta (primeiro por posição/data).
  select
    a.account_id,
    (select jwt.id
     from public.job_work_types jwt
     where jwt.account_id = a.account_id
     order by jwt."position" asc, jwt.created_at asc, jwt.id asc
     limit 1) as work_type_id
  from accounts_to_seed a
),
stages as (
  -- Lista de stages por conta (ordenadas por position).
  select
    a.account_id,
    array_agg(ks.id order by ks.position asc, ks.created_at asc, ks.id asc) as stage_ids
  from accounts_to_seed a
  join public.kanban_stages ks on ks.account_id = a.account_id
  group by a.account_id
),
contacts_seed as (
  insert into public.contacts (account_id, name, email, phone, notes)
  select
    a.account_id,
    format('Cliente Mock %s', i) as name,
    format('cliente.mock+%s.%s@exemplo.com', left(a.account_id::text, 8), i) as email,
    format('+55 11 9%04s-%04s', 1000 + i, 2000 + i) as phone,
    (select token from const) || ' — contato para prints de marketing.' as notes
  from accounts_to_seed a
  cross join generate_series(1, 12) as i
  returning id, account_id
),
contacts_by_account as (
  select
    c.account_id,
    array_agg(c.id order by c.created_at desc, c.id desc) as contact_ids
  from public.contacts c
  join accounts_to_seed a on a.account_id = c.account_id
  where c.notes like '%' || (select token from const) || '%'
  group by c.account_id
),
jobs_seed as (
  insert into public.jobs (
    account_id,
    contact_id,
    stage_id,
    "position",
    name,
    type,
    internal_deadline,
    deadline,
    job_date,
    work_type_id,
    parent_job_id,
    job_kind,
    notes,
    delivery_link,
    client_revision,
    photo_editor_id,
    video_editor_id,
    created_by
  )
  select
    a.account_id,
    -- Alterna contatos por índice (se houver).
    case
      when cba.contact_ids is null or array_length(cba.contact_ids, 1) = 0 then null
      else cba.contact_ids[((i - 1) % array_length(cba.contact_ids, 1)) + 1]
    end as contact_id,
    -- Alterna stages por índice (se houver).
    case
      when s.stage_ids is null or array_length(s.stage_ids, 1) = 0 then null
      else s.stage_ids[((i - 1) % array_length(s.stage_ids, 1)) + 1]
    end as stage_id,
    (i - 1) as "position",
    -- Nome com variedade, bom pra prints.
    case (i % 6)
      when 0 then format('Ensaio Externo — Mock %s', i)
      when 1 then format('Casamento — Mock %s', i)
      when 2 then format('Aniversário — Mock %s', i)
      when 3 then format('Evento Corporativo — Mock %s', i)
      when 4 then format('Reels / Social — Mock %s', i)
      else        format('Material Cliente — Mock %s', i)
    end as name,
    case (i % 3)
      when 0 then 'foto'
      when 1 then 'video'
      else        'foto_video'
    end as type,
    (current_date + (i + 3))::date as internal_deadline,
    (current_date + (i + 10))::date as deadline,
    case when (i % 4) = 0 then (current_date - (i % 12))::date else null end as job_date,
    wt.work_type_id,
    null::uuid as parent_job_id,
    case when (i % 5) = 0 then 'video_edit' else 'standard' end as job_kind,
    (select token from const) || format(' — job %s para marketing (kanban/agenda/detalhe).', i) as notes,
    format('https://drive.google.com/drive/folders/mock_%s_%s', left(a.account_id::text, 8), i) as delivery_link,
    ((i - 1) % 4)::smallint as client_revision,
    null::uuid as photo_editor_id,
    null::uuid as video_editor_id,
    ao.user_id as created_by
  from accounts_to_seed a
  join account_owner ao on ao.account_id = a.account_id
  join work_type wt on wt.account_id = a.account_id
  left join stages s on s.account_id = a.account_id
  left join contacts_by_account cba on cba.account_id = a.account_id
  cross join generate_series(1, 20) as i
  where wt.work_type_id is not null
  returning id, account_id
)
update public.accounts a
set
  delivery_email_subject_template = coalesce(
    a.delivery_email_subject_template,
    'Seu material de {{nome_job}} está pronto, {{nome_cliente}}'
  ),
  delivery_email_body_template = coalesce(
    a.delivery_email_body_template,
    'Oi {{nome_cliente}}!' || E'\n\n' ||
    'Aqui está o link do seu material: {{link_material}}' || E'\n\n' ||
    'Qualquer ajuste, me chama.' || E'\n\n' ||
    'Abraços,' || E'\n' ||
    '{{nome_remetente}}'
  ),
  google_calendar_embed_src = coalesce(
    a.google_calendar_embed_src,
    'https://calendar.google.com/calendar/embed?src=exemplo%40gmail.com&ctz=America%2FSao_Paulo'
  )
from accounts_to_seed ats
where a.id = ats.account_id;

