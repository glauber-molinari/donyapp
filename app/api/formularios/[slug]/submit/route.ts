import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { buildFormNotificationHtml, buildFormFieldsHtml } from "@/lib/email/form-notification-html";
import type { FormField } from "@/lib/formularios/types";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  const { data: template } = await supabase
    .from("form_templates")
    .select("id, account_id, title, fields")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (!template) {
    return NextResponse.json({ error: "Formulário não encontrado." }, { status: 404 });
  }

  let body: { answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const answers = (body.answers ?? {}) as Record<string, string | string[]>;
  const fields = Array.isArray(template.fields)
    ? (template.fields as unknown as FormField[])
    : [];

  const missing: string[] = [];
  for (const field of fields) {
    if (!field.required) continue;
    const val = answers[field.id];
    if (field.type === "checkbox") {
      if (!Array.isArray(val) || val.length === 0) missing.push(field.label);
    } else {
      const str = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
      if (!str.trim()) missing.push(field.label);
    }
  }

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Campos obrigatórios não preenchidos.", fields: missing },
      { status: 400 }
    );
  }

  const { data: submission, error: insertError } = await supabase
    .from("form_submissions")
    .insert({ form_template_id: template.id, account_id: template.account_id, data: answers })
    .select("id")
    .single();

  if (insertError || !submission) {
    console.error("[form_submissions insert]", insertError);
    return NextResponse.json({ error: "Erro ao salvar formulário." }, { status: 500 });
  }

  // Notificação à equipe: RESEND_API_KEY + RESEND_FROM + TEAM_NOTIFY_EMAIL no .env (ver .env.example).
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const teamEmail = process.env.TEAM_NOTIFY_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (apiKey && from && teamEmail) {
    try {
      const labeledAnswers: Record<string, string | string[]> = {};
      for (const field of fields) {
        if (answers[field.id] !== undefined) {
          labeledAnswers[field.label] = answers[field.id];
        }
      }

      const formFieldsHtml = buildFormFieldsHtml(
        fields.map((f) => ({ label: f.label })),
        labeledAnswers
      );

      const today = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const submissionUrl = `${appUrl}/formularios/recebidos`;

      const html = buildFormNotificationHtml({
        formTitle: template.title,
        formFieldsHtml,
        submissionUrl,
        today,
      });

      const formTextLines = [
        `Novo formulário recebido: ${template.title}`,
        `Data: ${today}`,
        ``,
        ...fields
          .map((f) => {
            const val = labeledAnswers[f.label];
            if (!val) return null;
            const display = Array.isArray(val) ? val.join(", ") : val;
            return `${f.label}: ${display}`;
          })
          .filter(Boolean),
        ``,
        `Ver formulário completo: ${submissionUrl}`,
      ];

      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: [teamEmail],
        subject: `Novo formulário recebido: ${template.title}`,
        html,
        text: formTextLines.join("\n"),
      });
    } catch (err) {
      console.error("[form notify email]", err);
    }
  }

  return NextResponse.json({ success: true, submissionId: submission.id });
}
