"use client";

import { ChevronRight, HeadphonesIcon, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { SupportTicketCategory, SupportTicketStatus } from "@/types/database";

import { SUPPORT_CATEGORIES } from "./constants";
import { createSupportTicket } from "./actions";

export interface TicketSummary {
  id: string;
  category: SupportTicketCategory;
  description: string;
  status: SupportTicketStatus;
  hasUnreadReply: boolean;
  createdAt: string;
}

interface SupportViewProps {
  tickets: TicketSummary[];
}

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Aberto",
  answered: "Respondido",
  closed: "Finalizado",
};

const STATUS_CLASSES: Record<SupportTicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  answered: "bg-green-50 text-green-700",
  closed: "bg-ds-cream text-ds-muted",
};

export function SupportView({ tickets }: SupportViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<SupportTicketCategory>("problema_tecnico");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createSupportTicket(fd);
      if (res.ok) {
        toast.success("Ticket enviado! Nossa equipe responderá em breve.");
        form.reset();
        setCategory("problema_tecnico");
        setModalOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-ink">Suporte</h1>
          <p className="mt-0.5 text-sm text-ds-muted">
            Abra um ticket e nossa equipe responderá o mais rápido possível.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="mt-3 shrink-0 sm:mt-0">
          <Plus className="h-4 w-4" />
          Novo ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-ds-xl border border-dashed border-app-border py-16 text-center">
          <HeadphonesIcon className="h-10 w-10 text-ds-subtle" />
          <p className="text-sm font-medium text-ds-muted">Nenhum ticket aberto ainda.</p>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            Abrir primeiro ticket
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo ticket de suporte"
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="support-category" className="text-sm font-medium text-ds-ink">
              Assunto <span className="text-red-500">*</span>
            </label>
            <select
              id="support-category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className="h-10 w-full rounded-ds-xl border border-app-border bg-app-canvas px-3 text-sm text-ds-ink focus:outline-none focus:ring-2 focus:ring-app-primary/25"
            >
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="support-description" className="text-sm font-medium text-ds-ink">
              Descreva o problema ou dúvida <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="support-description"
              name="description"
              placeholder="Explique com detalhes o que está acontecendo, quais passos você deu, o que esperava e o que aconteceu…"
              rows={6}
              maxLength={3000}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando…" : "Enviar ticket"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketSummary }) {
  const categoryLabel =
    SUPPORT_CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category;

  const date = new Date(ticket.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/support/${ticket.id}`}
      className="flex items-center gap-4 rounded-ds-xl border border-app-border bg-app-sidebar px-4 py-3.5 transition-shadow hover:shadow-ds-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ds-ink">{categoryLabel}</p>
          {ticket.hasUnreadReply && (
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-app-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-ds-muted">{ticket.description}</p>
        <p className="mt-1 text-xs text-ds-subtle">{date}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        <ChevronRight className="h-4 w-4 text-ds-subtle" />
      </div>
    </Link>
  );
}
