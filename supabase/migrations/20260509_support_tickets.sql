-- Tabelas para o sistema de tickets de suporte

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('problema_tecnico', 'duvida', 'cobranca', 'sugestao', 'outro')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  has_unread_reply boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'support')),
  sender_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas seus próprios tickets
CREATE POLICY "support_tickets_user_select"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "support_tickets_user_insert"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_tickets_user_update"
  ON support_tickets FOR UPDATE
  USING (user_id = auth.uid());

-- Usuários veem mensagens dos seus tickets
CREATE POLICY "support_ticket_messages_user_select"
  ON support_ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Usuários podem inserir suas próprias mensagens
CREATE POLICY "support_ticket_messages_user_insert"
  ON support_ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_account_id_idx ON support_tickets(account_id);
CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_idx ON support_ticket_messages(ticket_id);
