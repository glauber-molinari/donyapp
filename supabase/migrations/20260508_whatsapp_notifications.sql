-- WhatsApp notification settings per account
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_notify_days_before integer[] NOT NULL DEFAULT '{1,3}';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_notify_jobs boolean NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_notify_internal_deadline boolean NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_notify_tasks boolean NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_weekly_summary boolean NOT NULL DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_overdue_alerts boolean NOT NULL DEFAULT true;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_client_delivery_enabled boolean NOT NULL DEFAULT false;

-- Per-account sender instance (photographer's own WhatsApp as sender)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS zapi_sender_instance_id text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS zapi_sender_token text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS zapi_sender_connected boolean NOT NULL DEFAULT false;

-- Log to prevent duplicate notifications per day
CREATE TABLE IF NOT EXISTS whatsapp_notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('job', 'task', 'weekly')),
  entity_id text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('deadline', 'internal_deadline', 'overdue', 'weekly_summary')),
  days_before integer,
  phone text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_logs_dedup
  ON whatsapp_notification_logs(account_id, entity_id, entity_type, notification_type, COALESCE(days_before, -1), sent_date);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_account ON whatsapp_notification_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent_at ON whatsapp_notification_logs(sent_at);

ALTER TABLE whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts can view own whatsapp logs"
  ON whatsapp_notification_logs FOR SELECT
  USING (account_id = current_account_id());
