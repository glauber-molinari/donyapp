/**
 * Parse e classificação de webhooks AbacatePay (assinaturas).
 * @see https://docs.abacatepay.com/pages/webhooks/events/subscriptions
 */

import { createHmac, timingSafeEqual } from "crypto";

/** Chave pública documentada para HMAC-SHA256 do header `X-Webhook-Signature`. */
const ABACATEPAY_WEBHOOK_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export type ParsedAbacatePayWebhook = {
  webhookEventId: string | null;
  event: string;
  accountId: string | null;
  /** ID da assinatura AbacatePay (`subs_...`). */
  abacatePaySubscriptionId: string | null;
  /** Ciclo informado no webhook (`MONTHLY`, `ANNUALLY`, …). */
  frequency: string | null;
  cancelledDueTo: string | null;
};

function pickString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function verifyAbacatePayWebhookSignature(
  rawBody: string,
  signatureFromHeader: string | null
): boolean {
  if (!signatureFromHeader) return false;
  const expected = createHmac("sha256", ABACATEPAY_WEBHOOK_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureFromHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseAbacatePayWebhookPayload(body: Record<string, unknown>): ParsedAbacatePayWebhook {
  const event = pickString(body.event) ?? "";
  const webhookEventId = pickString(body.id);
  const data = asRecord(body.data) ?? {};

  const subscription = asRecord(data.subscription);
  const payment = asRecord(data.payment);
  const checkout = asRecord(data.checkout);
  const metadata = asRecord(checkout?.metadata) ?? asRecord(data.metadata);

  const accountId =
    pickString(payment?.externalId) ??
    pickString(checkout?.externalId) ??
    pickString(metadata?.accountId) ??
    pickString(data.externalId);

  return {
    webhookEventId,
    event,
    accountId,
    abacatePaySubscriptionId: pickString(subscription?.id),
    frequency: pickString(subscription?.frequency),
    cancelledDueTo: pickString(subscription?.cancelledDueTo),
  };
}

/** Assinatura ativa (primeira cobrança ou renovação). */
export function shouldActivatePro(parsed: ParsedAbacatePayWebhook): boolean {
  if (!parsed.accountId && !parsed.abacatePaySubscriptionId) return false;
  return (
    parsed.event === "subscription.completed" ||
    parsed.event === "subscription.renewed" ||
    parsed.event === "subscription.trial_started"
  );
}

export function shouldMarkPastDue(parsed: ParsedAbacatePayWebhook): boolean {
  return parsed.event === "subscription.payment_failed";
}

/**
 * Cancelamento por falha de cobrança — remove Pro.
 * Cancelamento manual (cliente ou API) — mantém Pro até o fim do período no app.
 */
export function shouldMarkSubscriptionFree(parsed: ParsedAbacatePayWebhook): boolean {
  return (
    parsed.event === "subscription.cancelled" &&
    parsed.cancelledDueTo === "max_payment_retries_exceeded"
  );
}

export function shouldMarkCancelAtPeriodEnd(parsed: ParsedAbacatePayWebhook): boolean {
  return (
    parsed.event === "subscription.cancelled" &&
    parsed.cancelledDueTo !== "max_payment_retries_exceeded"
  );
}

export function periodEndIsoFromFrequency(frequency: string | null | undefined): string {
  const end = new Date();
  const freq = (frequency ?? "").toUpperCase();
  if (freq === "ANNUALLY" || freq === "YEARLY") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else if (freq === "SEMIANNUALLY") {
    end.setUTCMonth(end.getUTCMonth() + 6);
  } else if (freq === "QUARTERLY") {
    end.setUTCMonth(end.getUTCMonth() + 3);
  } else if (freq === "WEEKLY") {
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
  return end.toISOString();
}
