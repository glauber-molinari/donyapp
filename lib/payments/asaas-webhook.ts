/**
 * Parse e classificação de webhooks Asaas (cobranças e assinaturas).
 * @see https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
 * @see https://docs.asaas.com/docs/webhook-para-cobrancas
 * @see https://docs.asaas.com/docs/eventos-para-assinaturas
 */

/** Eventos em que uma cobrança foi paga ou confirmada — adequados para liberar o Pro. */
const PAYMENT_SUCCESS_EVENTS = new Set([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
]);

/** Assinatura criada ou atualizada — liberar Pro se `status === ACTIVE` e houver `externalReference`. */
const SUBSCRIPTION_SYNC_EVENTS = new Set(["SUBSCRIPTION_CREATED", "SUBSCRIPTION_UPDATED"]);

export type ParsedAsaasWebhook = {
  webhookEventId: string | null;
  event: string;
  accountId: string | null;
  /** ID da assinatura Asaas (`sub_...`), quando existir. */
  asaasSubscriptionId: string | null;
};

function pickString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function parseAsaasWebhookPayload(body: Record<string, unknown>): ParsedAsaasWebhook {
  const event = pickString(body.event) ?? "";
  const webhookEventId = pickString(body.id);

  const payment = body.payment as Record<string, unknown> | undefined;
  const subscription = body.subscription as Record<string, unknown> | undefined;
  const checkout = body.checkout as Record<string, unknown> | undefined;

  const accountId =
    pickString(payment?.externalReference) ??
    pickString(subscription?.externalReference) ??
    pickString(checkout?.externalReference) ??
    pickString(body.externalReference);

  const asaasSubscriptionId =
    pickString(subscription?.id) ?? pickString(payment?.subscription as string | undefined);

  return {
    webhookEventId,
    event,
    accountId,
    asaasSubscriptionId,
  };
}

/** Indica se devemos ativar o plano Pro para a conta. */
export function shouldActivatePro(body: Record<string, unknown>, parsed: ParsedAsaasWebhook): boolean {
  const { event } = parsed;
  if (!parsed.accountId) return false;

  /** Checkout Asaas pago (cartão) — `externalReference` vem do checkout criado na API. */
  if (event === "CHECKOUT_PAID") {
    return true;
  }

  if (PAYMENT_SUCCESS_EVENTS.has(event)) {
    return true;
  }

  if (SUBSCRIPTION_SYNC_EVENTS.has(event)) {
    const subscription = body.subscription as { status?: string } | undefined;
    return subscription?.status === "ACTIVE";
  }

  return false;
}

export function shouldMarkPastDue(parsed: ParsedAsaasWebhook): boolean {
  return parsed.accountId != null && parsed.event === "PAYMENT_OVERDUE";
}

/** Assinatura inativada no Asaas — não renova; o cliente mantém Pro até o fim do período pago (cron). */
export function shouldMarkSubscriptionInactivated(parsed: ParsedAsaasWebhook): boolean {
  return parsed.accountId != null && parsed.event === "SUBSCRIPTION_INACTIVATED";
}

/** Assinatura removida no Asaas — encerra vínculo e volta ao Free. */
export function shouldMarkSubscriptionDeleted(parsed: ParsedAsaasWebhook): boolean {
  return parsed.accountId != null && parsed.event === "SUBSCRIPTION_DELETED";
}
