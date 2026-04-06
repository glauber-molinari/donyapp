import { NextResponse } from "next/server";

import { createAsaasProPaymentLink } from "@/lib/payments/asaas";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ ok: false, error: "Conta não encontrada." }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (sub?.plan === "pro") {
    return NextResponse.json({ ok: false, error: "Esta conta já está no plano Pro." }, { status: 400 });
  }

  const result = await createAsaasProPaymentLink(profile.account_id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    url: result.url,
    paymentLinkId: result.id,
  });
}
