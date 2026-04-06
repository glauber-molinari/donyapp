import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  parseAsaasWebhookPayload,
  shouldActivatePro,
  shouldMarkCanceledSubscription,
  shouldMarkPastDue,
} from "@/lib/payments/asaas-webhook";
import {
  setSubscriptionPastDueOrCanceled,
  setSubscriptionPro,
} from "@/lib/subscriptions/upgrade-account";

/**
 * Webhook Asaas — cobranças e assinaturas.
 * Token (recomendado): header `asaas-access-token` ou query `?token=` — variável `ASAAS_WEBHOOK_TOKEN`.
 * @see https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
 */
export async function POST(req: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
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

  if (shouldMarkCanceledSubscription(parsed) && parsed.accountId) {
    const { error } = await svc
      .from("subscriptions")
      .update({ plan: "free", status: "canceled" })
      .eq("account_id", parsed.accountId);
    if (error) {
      console.error("asaas webhook cancel:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    revalidatePath("/settings/plan");
    revalidatePath("/board");
  }

  return NextResponse.json({ ok: true });
}
