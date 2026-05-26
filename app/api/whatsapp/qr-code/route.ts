import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getQrCode } from "@/lib/whatsapp/client";

export async function GET() {
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
    .select("zapi_sender_instance_id, zapi_sender_token")
    .eq("id", profile.account_id)
    .maybeSingle();

  if (!account?.zapi_sender_instance_id || !account?.zapi_sender_token) {
    return NextResponse.json(
      { ok: false, error: "Configure o Instance ID e Token antes de gerar o QR code." },
      { status: 400 }
    );
  }

  const result = await getQrCode(account.zapi_sender_instance_id, account.zapi_sender_token);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  if (result.connected) {
    // Update connected status in DB
    await supabase
      .from("accounts")
      .update({ zapi_sender_connected: true })
      .eq("id", profile.account_id);

    return NextResponse.json({ ok: true, connected: true });
  }

  return NextResponse.json({ ok: true, connected: false, qrBase64: result.qrBase64 });
}
