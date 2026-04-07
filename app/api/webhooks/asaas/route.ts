import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  parseAsaasWebhookPayload,
  shouldActivatePro,
  shouldMarkPastDue,
  shouldMarkSubscriptionDeleted,
  shouldMarkSubscriptionInactivated,
} from "@/lib/payments/asaas-webhook";
import {
  setSubscriptionCancelAtPeriodEnd,
  setSubscriptionFreePlan,
  setSubscriptionPastDueOrCanceled,
  setSubscriptionPro,
} from "@/lib/subscriptions/upgrade-account";

/**
 * Webhook Asaas — cobranças e assinaturas.
 * Token: header `asaas-access-token` ou query `?token=` — `ASAAS_WEBHOOK_TOKEN`.
 * Em produção (Vercel ou NODE_ENV=production) o token é obrigatório.
 * @see https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
 */
export async function POST(req: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  const mustAuth =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (mustAuth && !token) {
    return NextResponse.json(
      { ok: false, error: "ASAAS_WEBHOOK_TOKEN não configurada." },
      { status: 500 }
    );
  }

  if (token) {
    const q = new URL(req.url).searchParams.get("token");
    const h = req.headers.get("asaas-access-token");
    if (q !== token && h !== token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    console.error("asaas webhook: service role ausente");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const parsed = parseAsaasWebhookPayload(body);

  if (shouldActivatePro(body, parsed) && parsed.accountId) {
    const r = await setSubscriptionPro(svc, parsed.accountId, {
      asaasSubscriptionId: parsed.asaasSubscriptionId,
    });
    if (!r.ok) {
      console.error("asaas webhook upgrade:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkPastDue(parsed) && parsed.accountId) {
    const r = await setSubscriptionPastDueOrCanceled(svc, parsed.accountId, "past_due");
    if (!r.ok) {
      console.error("asaas webhook past_due:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkSubscriptionInactivated(parsed) && parsed.accountId) {
    const r = await setSubscriptionCancelAtPeriodEnd(svc, parsed.accountId, { strict: false });
    if (!r.ok) {
      console.error("asaas webhook inactivate:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  if (shouldMarkSubscriptionDeleted(parsed) && parsed.accountId) {
    const r = await setSubscriptionFreePlan(svc, parsed.accountId);
    if (!r.ok) {
      console.error("asaas webhook subscription deleted:", r.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  return NextResponse.json({ ok: true });
}
