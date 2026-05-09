-- Módulo de formulários dinâmicos de captação de clientes

CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  fields JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  form_template_id UUID REFERENCES form_templates(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}',
  viewed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  linked_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX ON form_submissions(account_id);
CREATE INDEX ON form_submissions(form_template_id);
CREATE INDEX ON form_submissions(viewed);
CREATE INDEX ON form_submissions(submitted_at DESC);
CREATE INDEX ON form_templates(account_id);
CREATE INDEX ON form_templates(slug) WHERE active = true;

-- RLS

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- form_templates: leitura pública para templates ativos (formulários públicos)
CREATE POLICY "form_templates_anon_select" ON form_templates
  FOR SELECT TO anon
  USING (active = true);

-- form_templates: acesso completo para membros autenticados da conta
CREATE POLICY "form_templates_auth_select" ON form_templates
  FOR SELECT TO authenticated
  USING (account_id = current_account_id());

CREATE POLICY "form_templates_auth_insert" ON form_templates
  FOR INSERT TO authenticated
  WITH CHECK (account_id = current_account_id());

CREATE POLICY "form_templates_auth_update" ON form_templates
  FOR UPDATE TO authenticated
  USING (account_id = current_account_id())
  WITH CHECK (account_id = current_account_id());

CREATE POLICY "form_templates_auth_delete" ON form_templates
  FOR DELETE TO authenticated
  USING (account_id = current_account_id());

-- form_submissions: qualquer pessoa pode inserir (formulário público)
CREATE POLICY "form_submissions_public_insert" ON form_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

-- form_submissions: acesso completo para membros autenticados da conta
CREATE POLICY "form_submissions_auth_select" ON form_submissions
  FOR SELECT TO authenticated
  USING (account_id = current_account_id());

CREATE POLICY "form_submissions_auth_update" ON form_submissions
  FOR UPDATE TO authenticated
  USING (account_id = current_account_id())
  WITH CHECK (account_id = current_account_id());

CREATE POLICY "form_submissions_auth_delete" ON form_submissions
  FOR DELETE TO authenticated
  USING (account_id = current_account_id());
