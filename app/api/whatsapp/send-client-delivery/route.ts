import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { clientDeliveryMessage } from "@/lib/whatsapp/templates";

const PHONE_RE = /^\+?[\d\s\-()]{8,20}$/;

function isValidPhone(p: string): boolean {
  return PHONE_RE.test(p.trim());
}

export async function POST(req: Request) {
  if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Envio via WhatsApp não configurado no servidor." },
      { status: 503 }
    );
  }

  let body: { jobId?: string; phone?: string; customBody?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "Número de WhatsApp inválido. Use o formato (XX) XXXXX-XXXX." },
      { status: 400 }
    );
  }

  const jobId = (body.jobId ?? "").trim();
  if (!jobId) {
    return NextResponse.json({ ok: false, error: "jobId obrigatório." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ ok: false, error: "Perfil não encontrado." }, { status: 403 });
  }

  // Pro plan check
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if ((sub?.plan ?? "free") !== "pro") {
    return NextResponse.json(
      {
        ok: false,
        error: "Envio via WhatsApp ao cliente está disponível no plano Pro.",
        code: "PLAN_FREE",
      },
      { status: 403 }
    );
  }

  // Fetch job (must belong to same account)
  const { data: job } = await supabase
    .from("jobs")
    .select("id, name, delivery_link, account_id")
    .eq("id", jobId)
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ ok: false, error: "Edição não encontrada." }, { status: 404 });
  }

  if (!job.delivery_link) {
    return NextResponse.json(
      { ok: false, error: "Esta edição não tem link de entrega cadastrado." },
      { status: 400 }
    );
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("whatsapp_client_delivery_enabled, delivery_email_body_template, zapi_sender_instance_id, zapi_sender_token, zapi_sender_connected")
    .eq("id", profile.account_id)
    .maybeSingle();

  if (!account?.whatsapp_client_delivery_enabled) {
    return NextResponse.json(
      { ok: false, error: "Envio de entrega via WhatsApp não está habilitado nas configurações." },
      { status: 403 }
    );
  }

  const senderName = profile.name ?? "Fotógrafo";
  const message = clientDeliveryMessage(
    senderName,
    job.name,
    job.delivery_link,
    body.customBody ?? account.delivery_email_body_template
  );

  // Use per-account sender instance if connected, otherwise platform instance
  const usePerAccount =
    account.zapi_sender_connected &&
    account.zapi_sender_instance_id &&
    account.zapi_sender_token;

  const result = await sendWhatsAppText(
    phone,
    message,
    usePerAccount ? account.zapi_sender_instance_id! : undefined,
    usePerAccount ? account.zapi_sender_token! : undefined
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Falha ao enviar mensagem." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
