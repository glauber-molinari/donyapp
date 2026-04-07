-- Remove marketing mocks inseridos por supabase/seed/marketing-mocks.sql
-- OBS: não remove contas/usuários; só itens marcados no campo notes.

with const as (
  select 'MOCK_MARKETING_2026_04_07'::text as token
)
delete from public.jobs j
where j.notes like '%' || (select token from const) || '%';

with const as (
  select 'MOCK_MARKETING_2026_04_07'::text as token
)
delete from public.contacts c
where c.notes like '%' || (select token from const) || '%';

