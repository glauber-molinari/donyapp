/**
 * Link de pagamento Asaas com assinatura recorrente (checkout: cartão, PIX, boleto conforme link).
 * @see https://docs.asaas.com/reference/criar-um-link-de-pagamentos
 * @see https://docs.asaas.com/docs/link-de-pagamentos
 */

import { asaasPostJson, validateAsaasApiEnvMatch } from "@/lib/payments/asaas-client";
import { PRO_PRICE_MONTHLY_CENTS, PRO_PRICE_YEARLY_CENTS } from "@/lib/plan-limits";

/** Valor mensal em reais (API Asaas usa decimal). */
function proPriceMonthlyReais(): number {
  return PRO_PRICE_MONTHLY_CENTS / 100;
}

/** Valor anual em reais (API Asaas usa decimal). */
function proPriceYearlyReais(): number {
  return PRO_PRICE_YEARLY_CENTS / 100;
}

type PaymentLinkCreateResponse = {
  id?: string;
  url?: string;
};

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
 * Cria um link de pagamento recorrente (mensal ou anual) e `externalReference` = `accountId`.
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

  const { ok, json } = await asaasPostJson<PaymentLinkCreateResponse>("/v3/paymentLinks", {
    name: "Dony — Plano Pro",
    description: `Assinatura ${cycleLabel} — gestão de pós-produção`,
    value,
    billingType: "UNDEFINED",
    chargeType: "RECURRENT",
    subscriptionCycle: cycle,
    externalReference: accountId,
    notificationEnabled: true,
    /** Boleto: doc exige prazo quando o link permite boleto (@see PaymentLink guia). */
    dueDateLimitDays: 10,
    callback: {
      successUrl: `${appUrl}/settings/plan?status=success`,
      autoRedirect: true,
    },
  });

  if (!ok) {
    let msg = json.errors?.[0]?.description ?? "Falha ao criar link Asaas.";
    const low = msg.toLowerCase();
    if (low.includes("inválid") || low.includes("invalid")) {
      msg +=
        " Confira na Vercel: cole a chave completa (começa com $), sem \\ antes do $; ASAAS_API_URL=https://api.asaas.com para chave de produção; marque as vars para Production e faça redeploy.";
    }
    return { ok: false, error: msg };
  }

  if (!json.id || !json.url) {
    return { ok: false, error: "Resposta inválida do Asaas." };
  }

  return { ok: true, id: json.id, url: json.url };
}
