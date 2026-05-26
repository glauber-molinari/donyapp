import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getInstanceStatus } from "@/lib/whatsapp/client";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("zapi_sender_instance_id, zapi_sender_token, zapi_sender_connected")
    .eq("id", profile.account_id)
    .maybeSingle();

  if (!account?.zapi_sender_instance_id || !account?.zapi_sender_token) {
    return NextResponse.json({ ok: true, connected: false, configured: false });
  }

  const status = await getInstanceStatus(account.zapi_sender_instance_id, account.zapi_sender_token);

  // Sync DB if state changed
  if (status.connected !== account.zapi_sender_connected) {
    await supabase
      .from("accounts")
      .update({ zapi_sender_connected: status.connected })
      .eq("id", profile.account_id);
  }

  return NextResponse.json({ ok: true, connected: status.connected, configured: true, phone: status.phone });
}
