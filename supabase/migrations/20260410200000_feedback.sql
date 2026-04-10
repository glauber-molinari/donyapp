-- ============================================================
-- Feedback / Roadmap
-- ============================================================

-- Sugestões enviadas pelos usuários da plataforma
CREATE TABLE feedback_suggestions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  stage       text        CHECK (stage IN ('em_estudo', 'faremos', 'produzindo', 'pronto')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback_suggestions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem enviar suas próprias sugestões
CREATE POLICY "feedback: insert own"
  ON feedback_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários veem sugestões aprovadas OU as próprias (pendentes/rejeitadas)
CREATE POLICY "feedback: read approved or own"
  ON feedback_suggestions FOR SELECT
  TO authenticated
  USING (status = 'approved' OR user_id = auth.uid());

-- ============================================================
-- Votos (thumbs up) em sugestões aprovadas
-- ============================================================

CREATE TABLE feedback_votes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid        NOT NULL REFERENCES feedback_suggestions(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, user_id)
);

ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes: read all authenticated"
  ON feedback_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "votes: insert own"
  ON feedback_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "votes: delete own"
  ON feedback_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Índices de performance
CREATE INDEX feedback_suggestions_status_idx ON feedback_suggestions(status);
CREATE INDEX feedback_suggestions_stage_idx  ON feedback_suggestions(stage);
CREATE INDEX feedback_votes_suggestion_idx   ON feedback_votes(suggestion_id);
CREATE INDEX feedback_votes_user_idx         ON feedback_votes(user_id);
