-- Flags globais de feature para "ship dark": features mergeadas na master mas
-- escondidas atrás de uma flag, ligadas em produção em runtime (sem redeploy).
-- Segue o mesmo espírito do toggle accounts.album_board_enabled, mas global.
-- Leitura liberada para authenticated; escrita só via service_role (painel /admin).

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key        text PRIMARY KEY,
  enabled    boolean NOT NULL DEFAULT false,
  note       text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feature_flags IS
  'Flags globais de feature. enabled=true expõe a feature em runtime. Escrita só via service_role (admin).';

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Authenticated lê todas as flags; INSERT/UPDATE/DELETE sem policy => negado a JWT
-- (service_role ignora RLS e é quem escreve via painel admin).
CREATE POLICY "feature_flags: read all authenticated"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);
