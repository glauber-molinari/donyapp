import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  return NextResponse.json({ data });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : undefined;
  if (slug !== undefined && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." },
      { status: 400 }
    );
  }

  if (slug) {
    const { data: existing } = await supabase
      .from("form_templates")
      .select("id")
      .eq("slug", slug)
      .neq("id", params.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Já existe um formulário com esse slug." }, { status: 409 });
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.description === "string") update.description = body.description.trim() || null;
  if (slug !== undefined) update.slug = slug;
  if (Array.isArray(body.fields)) update.fields = body.fields;
  if (typeof body.active === "boolean") update.active = body.active;

  const { data, error } = await supabase
    .from("form_templates")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { error } = await supabase
    .from("form_templates")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
