import type { Metadata } from "next";
import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupportTicketCategory, SupportTicketStatus } from "@/types/database";

import { SUPPORT_CATEGORIES } from "@/app/(app)/support/constants";

export const metadata: Metadata = {
  title: "Suporte | Admin",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Aberto",
  answered: "Respondido",
  closed: "Finalizado",
};

const STATUS_CLASSES: Record<SupportTicketStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  answered: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-ds-cream text-ds-muted border-app-border",
};

export default async function AdminSupportPage() {
  const svc = createServiceRoleClient();

  if (!svc) {
    return (
      <div className="rounded-ds-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Configure <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> para
        acessar os tickets.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (svc as any)
    .from("support_tickets")
    .select("id, category, description, status, has_unread_reply, created_at, users(name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Suporte</h2>
        <p className="mt-2 text-sm text-red-600">Erro: {error.message}</p>
      </div>
    );
  }

  const tickets = (data ?? []) as Array<{
    id: string;
    category: SupportTicketCategory;
    description: string;
    status: SupportTicketStatus;
    has_unread_reply: boolean;
    created_at: string;
    users: { name: string | null; email: string | null } | null;
  }>;

  const open = tickets.filter((t) => t.status === "open");
  const answered = tickets.filter((t) => t.status === "answered");
  const closed = tickets.filter((t) => t.status === "closed");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Tickets de suporte</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Responda os tickets abertos pelos usuários.
        </p>
      </div>

      <TicketSection title="Aguardando resposta" count={open.length} badgeClass="bg-blue-100 text-blue-800">
        {open.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </TicketSection>

      <TicketSection title="Respondidos" count={answered.length} badgeClass="bg-green-100 text-green-800">
        {answered.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </TicketSection>

      <TicketSection title="Finalizados" count={closed.length} badgeClass="bg-ds-cream text-ds-muted">
        {closed.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </TicketSection>
    </div>
  );
}

function TicketSection({
  title,
  count,
  badgeClass,
  children,
}: {
  title: string;
  count: number;
  badgeClass: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ds-ink">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-ds-muted">Nenhum ticket.</p>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}

function TicketCard({
  ticket,
}: {
  ticket: {
    id: string;
    category: SupportTicketCategory;
    status: SupportTicketStatus;
    description: string;
    has_unread_reply: boolean;
    created_at: string;
    users: { name: string | null; email: string | null } | null;
  };
}) {
  const categoryLabel =
    SUPPORT_CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category;
  const date = new Date(ticket.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/admin/support/${ticket.id}`}
      className="flex items-start justify-between gap-4 rounded-ds-xl border border-app-border bg-app-sidebar p-4 transition-shadow hover:shadow-ds-sm"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ds-ink">{categoryLabel}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ds-muted">
          {ticket.description}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-ds-subtle">
          <span>{ticket.users?.name ?? ticket.users?.email ?? "Usuário"}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>
      <div className="shrink-0">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>
    </Link>
  );
}
