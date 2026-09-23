import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  parseAbacatePayWebhookPayload,
  periodEndIsoFromFrequency,
  shouldActivatePro,
  shouldMarkCancelAtPeriodEnd,
  shouldMarkPastDue,
  shouldMarkSubscriptionFree,
  verifyAbacatePayWebhookSignature,
} from "@/lib/payments/abacatepay-webhook";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  setSubscriptionCancelAtPeriodEnd,
  setSubscriptionFreePlan,
  setSubscriptionPastDueOrCanceled,
  setSubscriptionPro,
} from "@/lib/subscriptions/upgrade-account";

/**
 * Webhook AbacatePay — assinaturas.
 * Secret na query (`?webhookSecret=…`) + HMAC opcional em `X-Webhook-Signature`.
 * @see https://docs.abacatepay.com/pages/webhooks
 */
export async function POST(req: Request) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET?.trim();
  const isLocalDev =
    process.env.NODE_ENV === "development" && !process.env.VERCEL;

  if (!isLocalDev) {
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "ABACATEPAY_WEBHOOK_SECRET não configurada." },
        { status: 500 }
      );
    }
    const url = new URL(req.url);
    const fromQuery = url.searchParams.get("webhookSecret") ?? "";
    if (fromQuery !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  if (signature && !verifyAbacatePayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    console.error("abacatepay webhook: service role ausente");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const parsed = parseAbacatePayWebhookPayload(body);

  let accountId = parsed.accountId;
  if (!accountId && parsed.abacatePaySubscriptionId) {
    const { data: bySub } = await svc
      .from("subscriptions")
      .select("account_id")
      .eq("abacatepay_subscription_id", parsed.abacatePaySubscriptionId)
      .maybeSingle();
    accountId = bySub?.account_id ?? null;
  }

  if (shouldActivatePro(parsed) && accountId) {
    const r = await setSubscriptionPro(svc, accountId, {
      abacatePaySubscriptionId: parsed.abacatePaySubscriptionId,
      currentPeriodEndsAt: periodEndIsoFromFrequency(parsed.frequency),
    });
    if (!r.ok) {
      console.error("abacatepay webhook upgrade:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkPastDue(parsed) && accountId) {
    const r = await setSubscriptionPastDueOrCanceled(svc, accountId, "past_due");
    if (!r.ok) {
      console.error("abacatepay webhook past_due:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkCancelAtPeriodEnd(parsed) && accountId) {
    const r = await setSubscriptionCancelAtPeriodEnd(svc, accountId, { strict: false });
    if (!r.ok) {
      console.error("abacatepay webhook cancel_at_period_end:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkSubscriptionFree(parsed) && accountId) {
    const r = await setSubscriptionFreePlan(svc, accountId);
    if (!r.ok) {
      console.error("abacatepay webhook subscription free:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  return NextResponse.json({ ok: true });
}
