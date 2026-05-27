"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { buildTicketReplyEmailHtml } from "@/lib/email/support-email-html";
import { getResendFrom } from "@/lib/email/resend-from";
import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Acesso negado." };
  }
  return { ok: true };
}

export async function replyToTicket(ticketId: string, content: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "A resposta não pode estar vazia." };
  if (trimmed.length > 3000) return { ok: false, error: "Resposta muito longa." };

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket } = await (svc as any)
    .from("support_tickets")
    .select("id, status, user_id, users(name, email)")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) return { ok: false, error: "Ticket não encontrado." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: msgError } = await (svc as any).from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "support",
    sender_name: "Equipe Donyapp",
    content: trimmed,
  });

  if (msgError) return { ok: false, error: msgError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc as any)
    .from("support_tickets")
    .update({
      status: "answered",
      has_unread_reply: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  // Send email notification to user
  const apiKey = process.env.RESEND_API_KEY;
  const from = getResendFrom();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const userEmail = ticket.users?.email;
  const userName = ticket.users?.name ?? "usuário";

  if (apiKey && from && userEmail) {
    const resend = new Resend(apiKey);
    const ticketUrl = `${appUrl}/support/${ticketId}`;
    const html = buildTicketReplyEmailHtml({
      userName,
      replyContent: trimmed,
      ticketUrl,
    });

    const replyText = `Olá, ${userName}!\n\nSeu ticket de suporte foi respondido:\n\n${trimmed}\n\nAcesse o link para ver o ticket:\n${ticketUrl}`;
    await resend.emails.send({
      from,
      to: [userEmail],
      subject: "Seu ticket de suporte foi respondido — Donyapp",
      html,
      text: replyText,
    });
  }

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function closeTicket(ticketId: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("support_tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}
