/**
 * Operações na assinatura AbacatePay.
 * @see https://docs.abacatepay.com/pages/subscriptions/cancel
 */

import { abacatePayPostJson, validateAbacatePayApiEnv } from "@/lib/payments/abacatepay-client";

/**
 * Cancela a assinatura no processador (para novas cobranças).
 * No Dony mantemos o Pro até o fim do período já pago (`cancel_at_period_end`).
 */
export async function cancelAbacatePaySubscription(
  abacatePaySubscriptionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = validateAbacatePayApiEnv();
  if (!env.ok) {
    return { ok: false, error: env.error };
  }

  const { ok, status, json } = await abacatePayPostJson<{ id?: string; status?: string }>(
    "/subscriptions/cancel",
    { id: abacatePaySubscriptionId }
  );

  if (!ok) {
    const msg = json.error ?? `AbacatePay retornou HTTP ${status}.`;
    return { ok: false, error: msg };
  }
  return { ok: true };
}
