import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Informe ao menos um id." }, { status: 400 });
  }

  const safeIds = ids.filter((id): id is string => typeof id === "string");
  if (safeIds.length === 0) {
    return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
  }

  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .in("id", safeIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: safeIds.length });
}
