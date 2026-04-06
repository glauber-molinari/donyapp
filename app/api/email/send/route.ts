import { NextResponse } from "next/server";
import { Resend } from "resend";

import { buildDeliveryEmailHtml } from "@/lib/email/delivery-html";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { ok: false, error: "Envio de e-mail não configurado no servidor (RESEND_API_KEY / RESEND_FROM)." },
      { status: 503 }
    );
  }

  let body: { to?: string; subject?: string; bodyText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const to = (body.to ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const bodyText = (body.bodyText ?? "").trim();

  if (!to || !isValidEmail(to)) {
    return NextResponse.json({ ok: false, error: "Informe um e-mail de destino válido." }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ ok: false, error: "O assunto é obrigatório." }, { status: 400 });
  }
  if (!bodyText) {
    return NextResponse.json({ ok: false, error: "A mensagem não pode estar vazia." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("account_id, email, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.account_id) {
    return NextResponse.json({ ok: false, error: "Perfil não encontrado." }, { status: 403 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  const plan = sub?.plan ?? "free";
  if (plan !== "pro") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Envio de e-mail ao cliente está disponível no plano Pro. Faça upgrade em Configurações → Plano.",
        code: "PLAN_FREE",
      },
      { status: 403 }
    );
  }

  const replyTo = profile.email?.trim() || undefined;
  if (!replyTo) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Defina seu e-mail em Configurações → Perfil para usar como resposta (reply-to) ao cliente.",
      },
      { status: 400 }
    );
  }

  const html = buildDeliveryEmailHtml(bodyText);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo,
    subject,
    html,
  });

  if (error) {
    console.error("[Resend]", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Falha ao enviar e-mail." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
