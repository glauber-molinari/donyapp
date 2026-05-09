import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupportMessageSender, SupportTicketCategory, SupportTicketStatus } from "@/types/database";

import { SUPPORT_CATEGORIES } from "../constants";
import { markTicketRead } from "../actions";
import { TicketDetailView, type TicketMessage } from "./ticket-detail-view";

export const metadata: Metadata = {
  title: "Ticket de suporte | Donyapp",
};

export default async function SupportTicketPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const svc = createServiceRoleClient();
  if (!svc) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket } = await (svc as any)
    .from("support_tickets")
    .select("id, category, description, status, has_unread_reply, created_at, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages } = await (svc as any)
    .from("support_ticket_messages")
    .select("id, sender_type, sender_name, content, created_at")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  const categoryLabel =
    SUPPORT_CATEGORIES.find(
      (c) => c.value === (ticket.category as SupportTicketCategory)
    )?.label ?? ticket.category;

  const typedMessages: TicketMessage[] = (messages ?? []).map(
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

  // Mark as read server-side if needed
  if (ticket.has_unread_reply) {
    await markTicketRead(params.id);
  }

  return (
    <TicketDetailView
      ticketId={ticket.id}
      categoryLabel={categoryLabel}
      status={ticket.status as SupportTicketStatus}
      createdAt={ticket.created_at}
      messages={typedMessages}
    />
  );
}
