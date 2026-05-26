"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { SupportTicketStatus } from "@/types/database";

import { closeTicket, replyToTicket } from "../actions";

export interface AdminTicketMessage {
  id: string;
  senderType: "user" | "support";
  senderName: string;
  content: string;
  createdAt: string;
}

interface AdminTicketViewProps {
  ticketId: string;
  categoryLabel: string;
  status: SupportTicketStatus;
  createdAt: string;
  userName: string;
  userEmail: string | null;
  messages: AdminTicketMessage[];
}

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Aberto",
  answered: "Respondido",
  closed: "Finalizado",
};

const STATUS_CLASSES: Record<SupportTicketStatus, string> = {
  open: "bg-ds-info-soft text-ds-info",
  answered: "bg-ds-success-soft text-ds-success",
  closed: "bg-ds-cream text-ds-muted",
};

export function AdminTicketView({
  ticketId,
  categoryLabel,
  status,
  createdAt,
  userName,
  userEmail,
  messages,
}: AdminTicketViewProps) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();

  const date = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await replyToTicket(ticketId, reply);
      if (res.ok) {
        toast.success("Resposta enviada e usuário notificado por e-mail.");
        setReply("");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const res = await closeTicket(ticketId);
      if (res.ok) toast.success("Ticket encerrado.");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/support"
          className="flex items-center gap-1.5 rounded-ds-lg px-2 py-1.5 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ds-ink">{categoryLabel}</h2>
          <p className="mt-0.5 text-sm text-ds-muted">
            {userName}
            {userEmail ? ` · ${userEmail}` : ""} · {date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {status !== "closed" && (
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              title="Finalizar ticket"
              className="flex h-8 w-8 items-center justify-center rounded-ds-lg text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {status !== "closed" && (
        <form onSubmit={handleReply} className="flex flex-col gap-3 rounded-ds-xl border border-ds-border bg-ds-surface p-4">
          <Textarea
            id="admin-reply"
            label="Responder"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva sua resposta…"
            rows={4}
            maxLength={3000}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !reply.trim()}>
              {isPending ? "Enviando…" : "Enviar resposta"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: AdminTicketMessage }) {
  const isSupport = message.senderType === "support";
  const time = new Date(message.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex flex-col gap-1 ${isSupport ? "items-end" : ""}`}>
      <div
        className={`max-w-[85%] rounded-ds-xl px-4 py-3 ${
          isSupport
            ? "bg-ds-accent/10 border border-ds-accent/20"
            : "bg-ds-surface border border-ds-border"
        }`}
      >
        <p
          className={`mb-1 text-xs font-semibold ${isSupport ? "text-ds-accent" : "text-ds-muted"}`}
        >
          {isSupport ? "Equipe Donyapp" : message.senderName}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ds-ink">{message.content}</p>
      </div>
      <p className="px-1 text-xs text-ds-muted-2">{time}</p>
    </div>
  );
}
