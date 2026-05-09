-- Kanban de roadmap exclusivo do admin (sem RLS — acesso apenas via service role)

CREATE TABLE admin_roadmap_cards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  "column"    TEXT        NOT NULL CHECK ("column" IN ('ideia', 'executando', 'aplicado')),
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON admin_roadmap_cards("column", position);

-- Bloqueia acesso direto por qualquer role que não seja service_role
ALTER TABLE admin_roadmap_cards ENABLE ROW LEVEL SECURITY;
