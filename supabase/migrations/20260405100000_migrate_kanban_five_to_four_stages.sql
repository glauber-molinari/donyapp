-- Consolida contas com exatamente 5 etapas no kanban para o fluxo padrão de 4:
-- Backup | Em Edição | Em Aprovação | Entregue
--
-- Regras:
-- - Só altera contas onde COUNT(kanban_stages) = 5 (ordenação por position, desempate created_at).
-- - Mapeia por ordem: colunas 1..5 → destino 1..4, fundindo a antiga 5ª linha na 4ª.
-- - Jobs na 4ª etapa (ex.: "Aprovado") passam para a 3ª ("Em Aprovação").
-- - Jobs na 5ª etapa (ex.: "Entregue") passam para a 4ª (permanecem na linha que vira "Entregue").
-- - Remove apenas a linha duplicada (5º stage id), após mover FKs.
-- - Ao final, renumera jobs.position por stage (deadline, created_at).
-- - Idempotente: segunda execução não encontra COUNT=5 e não altera nada.

DO $$
DECLARE
  acc record;
  sid uuid[];
  s1 uuid;
  s2 uuid;
  s3 uuid;
  s4 uuid;
  s5 uuid;
BEGIN
  FOR acc IN
    SELECT account_id
    FROM public.kanban_stages
    GROUP BY account_id
    HAVING COUNT(*) = 5
  LOOP
    SELECT array_agg(id ORDER BY position ASC, created_at ASC)
    INTO sid
    FROM public.kanban_stages
    WHERE account_id = acc.account_id;

    IF sid IS NULL OR array_length(sid, 1) IS DISTINCT FROM 5 THEN
      CONTINUE;
    END IF;

    s1 := sid[1];
    s2 := sid[2];
    s3 := sid[3];
    s4 := sid[4];
    s5 := sid[5];

    -- 1) Antes de mover a 5ª coluna: jobs da 4ª etapa (ex.: Aprovado) → 3ª (Em Aprovação).
    -- 2) Depois: jobs da 5ª etapa (Entregue) → 4ª linha (id s4), que será renomeada "Entregue".
    --    (Se invertemos a ordem, jobs vindos do Entregue seriam levados por engano para Em Aprovação.)
    UPDATE public.jobs
    SET stage_id = s3, updated_at = now()
    WHERE account_id = acc.account_id AND stage_id = s4;

    UPDATE public.jobs
    SET stage_id = s4, updated_at = now()
    WHERE account_id = acc.account_id AND stage_id = s5;

    -- Metadados das 4 linhas restantes (ids fixos; só removemos s5).
    UPDATE public.kanban_stages
    SET
      name = 'Backup',
      color = 'bg-ds-accent/10',
      position = 1,
      is_final = false
    WHERE id = s1 AND account_id = acc.account_id;

    UPDATE public.kanban_stages
    SET
      name = 'Em Edição',
      color = 'bg-amber-50',
      position = 2,
      is_final = false
    WHERE id = s2 AND account_id = acc.account_id;

    UPDATE public.kanban_stages
    SET
      name = 'Em Aprovação',
      color = 'bg-blue-50',
      position = 3,
      is_final = false
    WHERE id = s3 AND account_id = acc.account_id;

    UPDATE public.kanban_stages
    SET
      name = 'Entregue',
      color = 'bg-pink-50',
      position = 4,
      is_final = true
    WHERE id = s4 AND account_id = acc.account_id;

    DELETE FROM public.kanban_stages
    WHERE id = s5 AND account_id = acc.account_id;
  END LOOP;
END $$;

-- Reordena position dos jobs dentro de cada etapa (consistente com o board).
UPDATE public.jobs AS j
SET position = sub.pos, updated_at = now()
FROM (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY stage_id
      ORDER BY deadline ASC NULLS LAST, created_at ASC
    ) - 1 AS pos
  FROM public.jobs
  WHERE stage_id IS NOT NULL
) AS sub
WHERE j.id = sub.id;
