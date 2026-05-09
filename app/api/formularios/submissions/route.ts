import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(req.url);
  const viewedParam = url.searchParams.get("viewed");
  const templateId = url.searchParams.get("form_template_id");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("form_submissions")
    .select("*, form_templates(title)", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (viewedParam === "true") query = query.eq("viewed", true);
  if (viewedParam === "false") query = query.eq("viewed", false);
  if (templateId) query = query.eq("form_template_id", templateId);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}
