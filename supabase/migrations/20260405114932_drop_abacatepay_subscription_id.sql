-- Remove legado AbacatePay (pagamentos apenas Asaas)
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS abacatepay_subscription_id;
