/**
 * Operações na assinatura Asaas (API v3).
 * @see https://docs.asaas.com/reference/update-existing-subscription
 */
import { asaasPutJson, validateAsaasApiEnvMatch } from "@/lib/payments/asaas-client";

/**
 * Interrompe novas cobranças (não renova). O cliente mantém o período já pago conforme regra de produto.
 */
export async function inactivateAsaasSubscription(
  asaasSubscriptionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = validateAsaasApiEnvMatch();
  if (!env.ok) {
    return { ok: false, error: env.error };
  }

  const path = `/v3/subscriptions/${encodeURIComponent(asaasSubscriptionId)}`;
  const { ok, status, json } = await asaasPutJson<Record<string, unknown>>(path, {
    status: "INACTIVE",
  });

  if (!ok) {
    const msg = json.errors?.[0]?.description ?? `Asaas retornou HTTP ${status}.`;
    return { ok: false, error: msg };
  }
  return { ok: true };
}
