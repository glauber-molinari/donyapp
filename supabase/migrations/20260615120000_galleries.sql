-- Módulo de Galerias: entrega e seleção de fotos para clientes

-- ---------------------------------------------------------------------------
-- Colunas de marca d'água na tabela accounts (aditivo)
-- ---------------------------------------------------------------------------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS watermark_config jsonb,
  ADD COLUMN IF NOT EXISTS watermark_logo_url text;

-- ---------------------------------------------------------------------------
-- galleries: galeria pública de entrega/seleção de fotos
-- ---------------------------------------------------------------------------
CREATE TABLE public.galleries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  job_id        uuid        REFERENCES public.jobs (id) ON DELETE SET NULL,
  slug          text        UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  title         text        NOT NULL,
  mode          text        NOT NULL DEFAULT 'delivery' CHECK (mode IN ('selection', 'delivery')),
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  cover_photo_id uuid,                          -- FK adicionada via ALTER abaixo (evita ciclo)
  password_hash text,
  expires_at    timestamptz,
  watermark_config jsonb,                       -- override da config da conta (nullable)
  download_enabled bool NOT NULL DEFAULT true,
  favorite_enabled bool NOT NULL DEFAULT true,
  created_by    uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- gallery_folders: pastas/sets dentro de uma galeria
-- ---------------------------------------------------------------------------
CREATE TABLE public.gallery_folders (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id    uuid        NOT NULL REFERENCES public.galleries (id) ON DELETE CASCADE,
  name          text        NOT NULL,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- gallery_photos: fotos da galeria (armazenadas no Cloudflare R2)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gallery_photos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id    uuid        NOT NULL REFERENCES public.galleries (id) ON DELETE CASCADE,
  folder_id     uuid        REFERENCES public.gallery_folders (id) ON DELETE SET NULL,
  r2_key        text        NOT NULL,
  filename      text        NOT NULL,
  size_bytes    bigint      NOT NULL DEFAULT 0,
  display_order integer     NOT NULL DEFAULT 0,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

-- FK da capa agora que gallery_photos existe
ALTER TABLE public.galleries
  ADD CONSTRAINT galleries_cover_photo_id_fkey
  FOREIGN KEY (cover_photo_id) REFERENCES public.gallery_photos (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- gallery_selections: seleção do cliente (submissão única por galeria)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gallery_selections (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id          uuid        NOT NULL REFERENCES public.galleries (id) ON DELETE CASCADE,
  selected_photo_ids  uuid[]      NOT NULL DEFAULT '{}',
  client_note         text,
  ip_hash             text,
  submitted_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
CREATE INDEX galleries_account_id_idx       ON public.galleries (account_id);
CREATE INDEX galleries_job_id_idx           ON public.galleries (job_id);
CREATE INDEX galleries_status_idx           ON public.galleries (status) WHERE status = 'published';
CREATE INDEX galleries_slug_idx             ON public.galleries (slug);
CREATE INDEX gallery_folders_gallery_id_idx ON public.gallery_folders (gallery_id);
CREATE INDEX gallery_photos_gallery_id_idx  ON public.gallery_photos (gallery_id);
CREATE INDEX gallery_photos_folder_id_idx   ON public.gallery_photos (folder_id);
CREATE INDEX gallery_selections_gallery_id  ON public.gallery_selections (gallery_id);

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
CREATE TRIGGER galleries_set_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.galleries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_selections ENABLE ROW LEVEL SECURITY;

-- galleries: membros autenticados da conta têm acesso total
CREATE POLICY "galleries_auth_all" ON public.galleries
  FOR ALL TO authenticated
  USING  (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- galleries: acesso anon apenas às galerias publicadas (para /g/[slug])
CREATE POLICY "galleries_anon_select" ON public.galleries
  FOR SELECT TO anon
  USING (status = 'published');

-- gallery_folders: acesso via galeria dona
CREATE POLICY "gallery_folders_auth_all" ON public.gallery_folders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = gallery_id
        AND g.account_id = public.current_account_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = gallery_id
        AND g.account_id = public.current_account_id()
    )
  );

-- gallery_photos: acesso via galeria dona
CREATE POLICY "gallery_photos_auth_all" ON public.gallery_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = gallery_id
        AND g.account_id = public.current_account_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = gallery_id
        AND g.account_id = public.current_account_id()
    )
  );

-- gallery_selections: leitura pelo fotógrafo (autenticado)
CREATE POLICY "gallery_selections_auth_select" ON public.gallery_selections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = gallery_id
        AND g.account_id = public.current_account_id()
    )
  );

-- gallery_selections: qualquer pessoa pode inserir (cliente anônimo envia seleção)
CREATE POLICY "gallery_selections_anon_insert" ON public.gallery_selections
  FOR INSERT TO anon
  WITH CHECK (true);
