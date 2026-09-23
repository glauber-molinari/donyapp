-- Troca processador: Asaas → AbacatePay
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS abacatepay_subscription_id text;

-- Não copia IDs do Asaas: formatos incompatíveis (sub_… vs subs_…).
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS asaas_subscription_id;

COMMENT ON COLUMN public.subscriptions.abacatepay_subscription_id IS
  'ID da assinatura na AbacatePay (subs_...). Null = Free, cortesia ou vitalício.';
