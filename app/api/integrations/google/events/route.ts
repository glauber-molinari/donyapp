import { NextResponse } from "next/server";

import { listCalendarEventsForAccount } from "@/lib/google-calendar/list-events";
import { createClient } from "@/lib/supabase/server";

const MAX_RANGE_MS = 120 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !me?.account_id) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 403 });
  }

  const url = new URL(request.url);
  const fromS = url.searchParams.get("from");
  const untilS = url.searchParams.get("until");
  if (!fromS || !untilS) {
    return NextResponse.json({ error: "Parâmetros from e until (ISO 8601) são obrigatórios." }, { status: 400 });
  }

  const timeMin = new Date(fromS);
  const timeMax = new Date(untilS);
  if (Number.isNaN(timeMin.getTime()) || Number.isNaN(timeMax.getTime())) {
    return NextResponse.json({ error: "Datas inválidas." }, { status: 400 });
  }
  if (timeMax.getTime() <= timeMin.getTime()) {
    return NextResponse.json({ error: "until deve ser posterior a from." }, { status: 400 });
  }
  if (timeMax.getTime() - timeMin.getTime() > MAX_RANGE_MS) {
    return NextResponse.json({ error: "Intervalo máximo de 120 dias." }, { status: 400 });
  }

  const result = await listCalendarEventsForAccount(me.account_id, timeMin, timeMax);
  if (!result.ok) {
    const notConnected = result.error === "Agenda não conectada.";
    return NextResponse.json(
      { error: result.error, events: [] },
      { status: notConnected ? 404 : 502 }
    );
  }

  return NextResponse.json({ events: result.events });
}
