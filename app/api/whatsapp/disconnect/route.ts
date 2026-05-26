import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { disconnectInstance } from "@/lib/whatsapp/client";

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

  const { data: account } = await supabase
    .from("accounts")
    .select("zapi_sender_instance_id, zapi_sender_token")
    .eq("id", profile.account_id)
    .maybeSingle();

  if (account?.zapi_sender_instance_id && account?.zapi_sender_token) {
    await disconnectInstance(account.zapi_sender_instance_id, account.zapi_sender_token);
  }

  await supabase
    .from("accounts")
    .update({ zapi_sender_connected: false })
    .eq("id", profile.account_id);

  return NextResponse.json({ ok: true });
}
