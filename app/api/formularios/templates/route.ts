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
  const activeParam = url.searchParams.get("active");

  let query = supabase
    .from("form_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeParam === "true") query = query.eq("active", true);
  if (activeParam === "false") query = query.eq("active", false);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Slug obrigatório." }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("form_templates")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Já existe um formulário com esse slug." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("form_templates")
    .insert({
      account_id: profile.account_id,
      title,
      slug,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      fields: Array.isArray(body.fields) ? body.fields : [],
      active: typeof body.active === "boolean" ? body.active : true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
