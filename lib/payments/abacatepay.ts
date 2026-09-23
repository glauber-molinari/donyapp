/**
 * Checkout de assinatura AbacatePay (página hospedada).
 * Produtos mensal/anual devem existir na loja com `cycle` definido.
 * @see https://docs.abacatepay.com/pages/subscriptions/create
 */

import { abacatePayPostJson, validateAbacatePayApiEnv } from "@/lib/payments/abacatepay-client";

export type AbacatePaySubscriptionCycle = "MONTHLY" | "YEARLY";

type SubscriptionCheckoutResponse = {
  id?: string;
  url?: string;
  externalId?: string | null;
  status?: string;
};

function productIdForCycle(cycle: AbacatePaySubscriptionCycle): string | null {
  const key =
    cycle === "YEARLY"
      ? process.env.ABACATEPAY_PRODUCT_ID_YEARLY
      : process.env.ABACATEPAY_PRODUCT_ID_MONTHLY;
  const id = key?.trim();
  return id || null;
}

/**
 * Cria checkout de assinatura recorrente (mensal ou anual).
 * `externalId` = `accountId` (UUID da conta Dony.app) para webhooks.
 */
export async function createAbacatePayProCheckout(
  accountId: string,
  cycle: AbacatePaySubscriptionCycle
): Promise<{ ok: true; url: string; id: string } | { ok: false; error: string }> {
  const env = validateAbacatePayApiEnv();
  if (!env.ok) {
    return { ok: false, error: env.error };
  }

  const productId = productIdForCycle(cycle);
  if (!productId) {
    const envName =
      cycle === "YEARLY" ? "ABACATEPAY_PRODUCT_ID_YEARLY" : "ABACATEPAY_PRODUCT_ID_MONTHLY";
    return {
      ok: false,
      error: `Configuração AbacatePay: ${envName} não configurada. Crie o produto com cycle na loja e cole o id (prod_…).`,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    return { ok: false, error: "NEXT_PUBLIC_APP_URL é obrigatório para o retorno do checkout." };
  }

  const { ok, json } = await abacatePayPostJson<SubscriptionCheckoutResponse>(
    "/subscriptions/create",
    {
      items: [{ id: productId, quantity: 1 }],
      methods: ["CARD"],
      externalId: accountId,
      metadata: { accountId, cycle },
      returnUrl: `${appUrl}/settings/plan?status=cancel`,
      completionUrl: `${appUrl}/settings/plan?status=success`,
      retryPolicy: {
        maxRetry: 3,
        retryEvery: 2,
      },
    }
  );

  if (!ok) {
    const msg = json.error ?? "Falha ao criar checkout AbacatePay.";
    return { ok: false, error: msg };
  }

  const id = json.data?.id;
  const url = json.data?.url;
  if (!id || !url) {
    return { ok: false, error: "Resposta inválida da AbacatePay (sem id/url do checkout)." };
  }

  return { ok: true, id, url };
}
