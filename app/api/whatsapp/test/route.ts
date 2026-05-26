import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText, isPlatformConfigured } from "@/lib/whatsapp/client";
import { testMessage } from "@/lib/whatsapp/templates";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id || profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Sem permissão." }, { status: 403 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if ((sub?.plan ?? "free") !== "pro") {
    return NextResponse.json({ ok: false, error: "Funcionalidade Pro.", code: "PLAN_FREE" }, { status: 403 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("name, whatsapp_number")
    .eq("id", profile.account_id)
    .maybeSingle();

  if (!account?.whatsapp_number) {
    return NextResponse.json(
      { ok: false, error: "Configure o número de WhatsApp antes de testar." },
      { status: 400 }
    );
  }

  if (!isPlatformConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Z-API não configurada no servidor." },
      { status: 503 }
    );
  }

  const msg = testMessage(account.name);
  const result = await sendWhatsAppText(account.whatsapp_number, msg);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
