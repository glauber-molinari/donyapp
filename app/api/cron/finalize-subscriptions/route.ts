import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { finalizeExpiredSubscriptionCancellations } from "@/lib/subscriptions/upgrade-account";

/**
 * Downgrade automático: Pro com cancelamento agendado após fim do período pago.
 * Configure CRON_SECRET na Vercel e o mesmo valor em Authorization: Bearer … para o cron.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "CRON_SECRET não configurada." }, { status: 500 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ ok: false, error: "Service role não configurada." }, { status: 500 });
  }

  const r = await finalizeExpiredSubscriptionCancellations(svc);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }

  revalidatePath("/settings/plan");
  revalidatePath("/board");

  return NextResponse.json({ ok: true, finalized: r.finalized });
}
