-- Corrige a FK de feedback_suggestions.user_id para referenciar
-- public.users (acessível pelo PostgREST) em vez de auth.users.

ALTER TABLE feedback_suggestions
  DROP CONSTRAINT feedback_suggestions_user_id_fkey;

ALTER TABLE feedback_suggestions
  ADD CONSTRAINT feedback_suggestions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Mesma correção para feedback_votes
ALTER TABLE feedback_votes
  DROP CONSTRAINT feedback_votes_user_id_fkey;

ALTER TABLE feedback_votes
  ADD CONSTRAINT feedback_votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
