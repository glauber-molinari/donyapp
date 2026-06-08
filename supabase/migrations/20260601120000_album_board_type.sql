-- Discriminator for two-board system: edicao (current) vs album (new).
-- Both jobs and kanban_stages get a board_type column to filter on.

ALTER TABLE public.kanban_stages
  ADD COLUMN board_type text NOT NULL DEFAULT 'edicao'
  CHECK (board_type IN ('edicao', 'album'));

ALTER TABLE public.jobs
  ADD COLUMN board_type text NOT NULL DEFAULT 'edicao'
  CHECK (board_type IN ('edicao', 'album'));

CREATE INDEX IF NOT EXISTS jobs_account_board_type_idx
  ON public.jobs (account_id, board_type);

CREATE INDEX IF NOT EXISTS kanban_stages_account_board_type_idx
  ON public.kanban_stages (account_id, board_type);

COMMENT ON COLUMN public.jobs.board_type IS
  'Discriminator for board: edicao (post-production of media) or album (physical album production). Album jobs may have parent_job_id pointing to source edicao job.';

COMMENT ON COLUMN public.kanban_stages.board_type IS
  'Discriminator for stage: edicao (default) or album. Stages are filtered by board_type when rendering each board.';
