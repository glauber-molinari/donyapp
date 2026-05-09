import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SUPPORT_CATEGORIES } from "@/app/(app)/support/constants";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupportMessageSender, SupportTicketCategory, SupportTicketStatus } from "@/types/database";

import { AdminTicketView, type AdminTicketMessage } from "./admin-ticket-view";

export const metadata: Metadata = {
  title: "Ticket | Admin Suporte",
};

export default async function AdminSupportTicketPage({ params }: { params: { id: string } }) {
  const svc = createServiceRoleClient();
  if (!svc) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket } = await (svc as any)
    .from("support_tickets")
    .select("id, category, description, status, created_at, users(name, email)")
    .eq("id", params.id)
    .maybeSingle();

  if (!ticket) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages } = await (svc as any)
    .from("support_ticket_messages")
    .select("id, sender_type, sender_name, content, created_at")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  const categoryLabel =
    SUPPORT_CATEGORIES.find((c) => c.value === (ticket.category as SupportTicketCategory))
      ?.label ?? ticket.category;

  const typedMessages: AdminTicketMessage[] = (messages ?? []).map(
    (m: {
      id: string;
      sender_type: SupportMessageSender;
      sender_name: string;
      content: string;
      created_at: string;
    }) => ({
      id: m.id,
      senderType: m.sender_type,
      senderName: m.sender_name,
      content: m.content,
      createdAt: m.created_at,
    })
  );

  return (
    <AdminTicketView
      ticketId={ticket.id}
      categoryLabel={categoryLabel}
      status={ticket.status as SupportTicketStatus}
      createdAt={ticket.created_at}
      userName={ticket.users?.name ?? ticket.users?.email ?? "Usuário"}
      userEmail={ticket.users?.email ?? null}
      messages={typedMessages}
    />
  );
}
