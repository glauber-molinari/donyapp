-- Retira o acesso público ao módulo de Galerias (feature desligada).
-- Tabelas, fotos no R2 e o bucket gallery-watermarks permanecem intactos.

DROP POLICY IF EXISTS "galleries_anon_select" ON public.galleries;
DROP POLICY IF EXISTS "gallery_selections_anon_insert" ON public.gallery_selections;

INSERT INTO public.feature_flags (key, enabled, note, updated_at)
VALUES (
  'galerias',
  false,
  'Módulo de Galerias retirado do ar. Dados preservados; superfície desligada.',
  now()
)
ON CONFLICT (key) DO UPDATE
SET enabled = false,
    note = EXCLUDED.note,
    updated_at = now();
