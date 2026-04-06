import { randomBytes } from "crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { buildInviteEmailHtml } from "@/lib/email/invite-email-html";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (u) return u;
  return "";
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { ok: false, error: "E-mail não configurado (RESEND_API_KEY / RESEND_FROM)." },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const raw = (body.email ?? "").trim().toLowerCase();
  if (!raw || !EMAIL_RE.test(raw)) {
    return NextResponse.json({ ok: false, error: "Informe um e-mail válido." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !me?.account_id || me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Apenas administradores podem convidar." }, { status: 403 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", me.account_id)
    .maybeSingle();

  if ((sub?.plan ?? "free") !== "pro") {
    return NextResponse.json(
      {
        ok: false,
        error: "Convites para equipe estão disponíveis no plano Pro.",
        code: "PLAN_FREE",
      },
      { status: 403 }
    );
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", me.account_id)
    .single();

  const accountName = account?.name ?? "Estúdio";

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, account_id")
    .ilike("email", raw)
    .maybeSingle();

  if (existingUser?.account_id === me.account_id) {
    return NextResponse.json(
      { ok: false, error: "Este e-mail já é membro da conta." },
      { status: 400 }
    );
  }
  if (existingUser?.account_id && existingUser.account_id !== me.account_id) {
    return NextResponse.json(
      { ok: false, error: "Este e-mail já está vinculado a outra conta no dony." },
      { status: 400 }
    );
  }

  const { data: pending } = await supabase
    .from("invitations")
    .select("id")
    .eq("account_id", me.account_id)
    .eq("email", raw)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (pending) {
    return NextResponse.json(
      { ok: false, error: "Já existe um convite pendente para este e-mail." },
      { status: 400 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: insErr } = await supabase.from("invitations").insert({
    account_id: me.account_id,
    email: raw,
    token,
    role: "member",
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error(insErr);
    return NextResponse.json({ ok: false, error: "Não foi possível salvar o convite." }, { status: 500 });
  }

  const origin = appOrigin();
  if (!origin) {
    return NextResponse.json(
      { ok: false, error: "Defina NEXT_PUBLIC_APP_URL para o link do convite." },
      { status: 503 }
    );
  }

  const inviteUrl = `${origin}/invite/${token}`;
  const html = buildInviteEmailHtml({ accountName, inviteUrl });

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to: [raw],
    subject: `Convite para equipe — ${accountName}`,
    html,
  });

  if (sendErr) {
    console.error("[Resend invite]", sendErr);
    await supabase.from("invitations").delete().eq("token", token);
    return NextResponse.json(
      { ok: false, error: sendErr.message || "Falha ao enviar o e-mail." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
