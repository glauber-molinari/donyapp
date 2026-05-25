-- Tabela de histórico de alterações dos jobs
CREATE TABLE public.job_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  account_id   UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  changed_by   UUID        REFERENCES auth.users(id),
  changed_by_name TEXT,
  field        TEXT        NOT NULL,   -- 'created' | 'stage' | 'name' | 'client_revision' | 'delivery_link' | 'deadline' | 'internal_deadline' | 'notes'
  old_value    TEXT,
  new_value    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_history_job_id_created_at_idx ON public.job_history(job_id, created_at DESC);

-- RLS: apenas membros da conta podem ler
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account members can read job_history"
  ON public.job_history FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Função trigger para logar alterações
CREATE OR REPLACE FUNCTION public.log_job_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id        UUID;
  v_user_name      TEXT;
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT name INTO v_user_name
  FROM public.users
  WHERE id = v_user_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.job_history
      (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
    VALUES
      (NEW.id, NEW.account_id, v_user_id, v_user_name, 'created', NULL, NEW.name);

  ELSIF TG_OP = 'UPDATE' THEN

    -- Etapa (coluna do kanban)
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
      SELECT name INTO v_old_stage_name FROM public.kanban_stages WHERE id = OLD.stage_id;
      SELECT name INTO v_new_stage_name FROM public.kanban_stages WHERE id = NEW.stage_id;
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'stage', v_old_stage_name, v_new_stage_name);
    END IF;

    -- Nome do job
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'name', OLD.name, NEW.name);
    END IF;

    -- Alteração do cliente
    IF OLD.client_revision IS DISTINCT FROM NEW.client_revision THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'client_revision',
         OLD.client_revision::TEXT, NEW.client_revision::TEXT);
    END IF;

    -- Link de entrega
    IF OLD.delivery_link IS DISTINCT FROM NEW.delivery_link THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'delivery_link',
         OLD.delivery_link, NEW.delivery_link);
    END IF;

    -- Prazo final
    IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'deadline',
         OLD.deadline, NEW.deadline);
    END IF;

    -- Prazo interno
    IF OLD.internal_deadline IS DISTINCT FROM NEW.internal_deadline THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'internal_deadline',
         OLD.internal_deadline, NEW.internal_deadline);
    END IF;

    -- Observações
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO public.job_history
        (job_id, account_id, changed_by, changed_by_name, field, old_value, new_value)
      VALUES
        (NEW.id, NEW.account_id, v_user_id, v_user_name, 'notes',
         OLD.notes, NEW.notes);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER job_history_trigger
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.log_job_changes();
