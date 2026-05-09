import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupportTicketCategory, SupportTicketStatus } from "@/types/database";

import { SupportView, type TicketSummary } from "./support-view";

export const metadata: Metadata = {
  title: "Suporte | Donyapp",
};

export default async function SupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const svc = createServiceRoleClient();

  let tickets: TicketSummary[] = [];

  if (svc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (svc as any)
      .from("support_tickets")
      .select("id, category, description, status, has_unread_reply, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    tickets = (data ?? []).map(
      (row: {
        id: string;
        category: SupportTicketCategory;
        description: string;
        status: SupportTicketStatus;
        has_unread_reply: boolean;
        created_at: string;
      }) => ({
        id: row.id,
        category: row.category,
        description: row.description,
        status: row.status,
        hasUnreadReply: row.has_unread_reply,
        createdAt: row.created_at,
      })
    );
  }

  return <SupportView tickets={tickets} />;
}
