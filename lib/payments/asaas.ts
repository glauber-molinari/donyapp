/**
 * Checkout Asaas (sessão hospedada): apenas cartão de crédito, assinatura recorrente.
 * O link de pagamentos (`/v3/paymentLinks` + `UNDEFINED`) inclui boleto; o checkout com CREDIT_CARD não.
 *
 * @see https://docs.asaas.com/reference/create-new-checkout
 * @see https://docs.asaas.com/docs/link-do-checkout-e-redirecionamento-do-cliente
 * @see https://docs.asaas.com/docs/checkout-com-assinatura-recorrente
 */

import { asaasPostJson, validateAsaasApiEnvMatch } from "@/lib/payments/asaas-client";
import { PRO_PRICE_MONTHLY_CENTS, PRO_PRICE_YEARLY_CENTS } from "@/lib/plan-limits";

/**
 * PNG 1×1 (transparente). O Asaas não aceita SVG em `imageBase64` do checkout
 * (“extensão não suportada”); só formatos raster (ex.: PNG/JPEG).
 */
const CHECKOUT_ITEM_IMAGE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function shouldAppendAsaasConfigHint(msg: string): boolean {
  const low = msg.toLowerCase();
  if (low.includes("extensão") || low.includes("extension")) return false;
  if (low.includes("imagem") || low.includes("image") || low.includes("arquivo")) return false;
  return low.includes("inválid") || low.includes("invalid");
}

/** Valor mensal em reais (API Asaas usa decimal). */
function proPriceMonthlyReais(): number {
  return PRO_PRICE_MONTHLY_CENTS / 100;
}

/** Valor anual em reais (API Asaas usa decimal). */
function proPriceYearlyReais(): number {
  return PRO_PRICE_YEARLY_CENTS / 100;
}

type CheckoutCreateResponse = {
  id?: string;
};

function checkoutShowUrl(checkoutId: string): string {
  return `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;
}

function subscriptionDates(): { nextDueDate: string; endDate: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const start = new Date();
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 10);
  return { nextDueDate: ymd(start), endDate: ymd(end) };
}

/**
 * Cria um link de pagamento com cobrança recorrente mensal e `externalReference` = `accountId` (UUID da conta Donyapp).
 */
export async function createAsaasProPaymentLink(accountId: string): Promise<
  { ok: true; url: string; id: string } | { ok: false; error: string }
> {
  return createAsaasProPaymentLinkWithCycle(accountId, "MONTHLY");
}

export type AsaasSubscriptionCycle = "MONTHLY" | "YEARLY";

/**
 * Cria sessão de checkout recorrente (mensal ou anual) só com cartão de crédito.
 * `externalReference` = `accountId` (webhooks de cobrança, assinatura e CHECKOUT_PAID).
 */
export async function createAsaasProPaymentLinkWithCycle(
  accountId: string,
  cycle: AsaasSubscriptionCycle
): Promise<{ ok: true; url: string; id: string } | { ok: false; error: string }> {
  const envMatch = validateAsaasApiEnvMatch();
  if (!envMatch.ok) {
    return { ok: false, error: envMatch.error };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    return { ok: false, error: "NEXT_PUBLIC_APP_URL é obrigatório para o retorno do checkout." };
  }

  const value = cycle === "YEARLY" ? proPriceYearlyReais() : proPriceMonthlyReais();
  const cycleLabel = cycle === "YEARLY" ? "anual" : "mensal";
  const { nextDueDate, endDate } = subscriptionDates();

  const { ok, json } = await asaasPostJson<CheckoutCreateResponse>("/v3/checkouts", {
    billingTypes: ["CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 1440,
    externalReference: accountId,
    callback: {
      successUrl: `${appUrl}/settings/plan?status=success`,
      cancelUrl: `${appUrl}/settings/plan?status=cancel`,
      expiredUrl: `${appUrl}/settings/plan?status=expired`,
    },
    items: [
      {
        name: "Dony — Plano Pro",
        description: `Assinatura ${cycleLabel} — gestão de pós-produção`,
        imageBase64: CHECKOUT_ITEM_IMAGE_PNG_BASE64,
        quantity: 1,
        value,
      },
    ],
    subscription: {
      cycle,
      nextDueDate,
      endDate,
    },
  });

  if (!ok) {
    let msg = json.errors?.[0]?.description ?? "Falha ao criar checkout Asaas.";
    if (shouldAppendAsaasConfigHint(msg)) {
      msg +=
        " Confira na Vercel: cole a chave completa (começa com $), sem \\ antes do $; ASAAS_API_URL=https://api.asaas.com para chave de produção; permissão CHECKOUT:WRITE na chave; marque as vars para Production e faça redeploy.";
    }
    return { ok: false, error: msg };
  }

  if (!json.id) {
    return { ok: false, error: "Resposta inválida do Asaas (sem id do checkout)." };
  }

  return { ok: true, id: json.id, url: checkoutShowUrl(json.id) };
}
