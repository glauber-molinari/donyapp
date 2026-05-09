"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { buildNewTicketEmailHtml } from "@/lib/email/support-email-html";
import { getSupportEmail } from "@/lib/support";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupportTicketCategory } from "@/types/database";

import { SUPPORT_CATEGORIES } from "./constants";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createSupportTicket(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const category = (formData.get("category") as string)?.trim() as SupportTicketCategory;
  const description = (formData.get("description") as string)?.trim() ?? "";

  const validCategories: SupportTicketCategory[] = [
    "problema_tecnico",
    "duvida",
    "cobranca",
    "sugestao",
    "outro",
  ];
  if (!validCategories.includes(category)) {
    return { ok: false, error: "Selecione uma categoria." };
  }
  if (!description) return { ok: false, error: "Descreva seu problema ou dúvida." };
  if (description.length > 3000) {
    return { ok: false, error: "Descrição muito longa (máximo 3000 caracteres)." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { ok: false, error: "Perfil não encontrado." };
  }

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket, error: insertError } = await (svc as any)
    .from("support_tickets")
    .insert({
      account_id: profile.account_id,
      user_id: user.id,
      category,
      description,
    })
    .select("id")
    .single();

  if (insertError || !ticket) {
    return { ok: false, error: insertError?.message ?? "Erro ao criar ticket." };
  }

  // Also insert initial user message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc as any).from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_type: "user",
    sender_name: profile.name ?? user.email ?? "Usuário",
    content: description,
  });

  // Send email to support team
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (apiKey && from) {
    const resend = new Resend(apiKey);
    const adminUrl = `${appUrl}/admin/support/${ticket.id}`;
    const html = buildNewTicketEmailHtml({
      userName: profile.name ?? user.email ?? "Usuário",
      userEmail: profile.email ?? user.email ?? "",
      category,
      description,
      ticketId: ticket.id,
      adminUrl,
    });

    await resend.emails.send({
      from,
      to: [getSupportEmail()],
      replyTo: profile.email ?? user.email ?? undefined,
      subject: `[Suporte] ${SUPPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category}`,
      html,
    });
  }

  revalidatePath("/support");
  return { ok: true };
}

export async function sendUserMessage(ticketId: string, content: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "A mensagem não pode estar vazia." };
  if (trimmed.length > 3000) return { ok: false, error: "Mensagem muito longa." };

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // Confirma que o ticket pertence ao usuário e não está finalizado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket } = await (svc as any)
    .from("support_tickets")
    .select("id, status, users(name)")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket) return { ok: false, error: "Ticket não encontrado." };
  if (ticket.status === "closed") return { ok: false, error: "Este ticket foi finalizado." };

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: msgError } = await (svc as any).from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "user",
    sender_name: profile?.name ?? user.email ?? "Usuário",
    content: trimmed,
  });

  if (msgError) return { ok: false, error: msgError.message };

  // Reabre o ticket para o suporte responder
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc as any)
    .from("support_tickets")
    .update({ status: "open", has_unread_reply: false, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath(`/support/${ticketId}`);
  return { ok: true };
}

export async function markTicketRead(ticketId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("support_tickets")
    .update({ has_unread_reply: false })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
}
