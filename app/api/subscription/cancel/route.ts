import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { cancelAbacatePaySubscription } from "@/lib/payments/abacatepay-subscription";
import { createClient } from "@/lib/supabase/server";
import { setSubscriptionCancelAtPeriodEnd } from "@/lib/subscriptions/upgrade-account";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" || !profile.account_id) {
    return NextResponse.json({ ok: false, error: "Apenas administradores podem cancelar a assinatura." }, { status: 403 });
  }

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("plan, abacatepay_subscription_id, cancel_at_period_end")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (subErr || !sub) {
    return NextResponse.json({ ok: false, error: "Não foi possível carregar a assinatura." }, { status: 400 });
  }

  if (sub.plan !== "pro") {
    return NextResponse.json({ ok: false, error: "Esta conta não está no plano Pro." }, { status: 400 });
  }

  if (sub.cancel_at_period_end) {
    return NextResponse.json({ ok: false, error: "O cancelamento já está agendado." }, { status: 400 });
  }

  const abacateId = sub.abacatepay_subscription_id?.trim();
  if (!abacateId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Esta conta não possui assinatura recorrente na AbacatePay para cancelar aqui. Fale com o suporte.",
      },
      { status: 400 }
    );
  }

  const payResult = await cancelAbacatePaySubscription(abacateId);
  if (!payResult.ok) {
    return NextResponse.json({ ok: false, error: payResult.error }, { status: 502 });
  }

  const dbResult = await setSubscriptionCancelAtPeriodEnd(supabase, profile.account_id, { strict: true });
  if (!dbResult.ok) {
    return NextResponse.json({ ok: false, error: dbResult.error }, { status: 500 });
  }

  revalidatePath("/settings/plan");
  revalidatePath("/board");

  return NextResponse.json({ ok: true });
}
