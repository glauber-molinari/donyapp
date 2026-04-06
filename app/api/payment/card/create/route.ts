import { NextResponse } from "next/server";

import { createAsaasProPaymentLinkWithCycle } from "@/lib/payments/asaas";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let cycle: "MONTHLY" | "YEARLY" = "MONTHLY";
  try {
    const body = (await req.json()) as null | { cycle?: string };
    const raw = body?.cycle;
    if (raw === "YEARLY" || raw === "MONTHLY") cycle = raw;
  } catch {
    // body opcional
  }

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

  const result = await createAsaasProPaymentLinkWithCycle(profile.account_id, cycle);
  if (!result.ok) {
    const isConfig =
      result.error.startsWith("Configuração Asaas:") ||
      result.error.includes("ASAAS_API_KEY não") ||
      result.error.includes("NEXT_PUBLIC_APP_URL");
    return NextResponse.json({ ok: false, error: result.error }, { status: isConfig ? 400 : 502 });
  }

  return NextResponse.json({
    ok: true,
    url: result.url,
    paymentLinkId: result.id,
  });
}
