"use client";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type { SupportTicketStatus } from "@/types/database";

import { sendUserMessage } from "../actions";

export interface TicketMessage {
  id: string;
  senderType: "user" | "support";
  senderName: string;
  content: string;
  createdAt: string;
}

interface TicketDetailViewProps {
  ticketId: string;
  categoryLabel: string;
  status: SupportTicketStatus;
  createdAt: string;
  messages: TicketMessage[];
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

export function TicketDetailView({
  ticketId,
  categoryLabel,
  status,
  createdAt,
  messages,
}: TicketDetailViewProps) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const date = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendUserMessage(ticketId, reply);
      if (res.ok) {
        setReply("");
        textareaRef.current?.focus();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/support"
          className="flex items-center gap-1.5 rounded-ds-xl px-2 py-1.5 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ds-ink">{categoryLabel}</h1>
          <p className="mt-0.5 text-sm text-ds-muted">Aberto em {date}</p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Thread de mensagens */}
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Formulário de resposta — apenas se não finalizado */}
      {status !== "closed" ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-app-sidebar p-4"
        >
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva uma mensagem…"
            rows={3}
            maxLength={3000}
            disabled={isPending}
            className="w-full resize-y rounded-ds-xl border border-app-border bg-app-canvas px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/20 disabled:opacity-60"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !reply.trim()} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {isPending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-ds-xl border border-app-border bg-ds-cream/50 p-4 text-sm text-ds-muted">
          Este ticket foi finalizado. Se precisar de mais ajuda, abra um novo ticket.
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isSupport = message.senderType === "support";
  const time = new Date(message.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex flex-col gap-1 ${isSupport ? "" : "items-end"}`}>
      <div
        className={`max-w-[85%] rounded-ds-xl px-4 py-3 ${
          isSupport
            ? "bg-app-sidebar border border-app-border"
            : "bg-app-primary/10 border border-app-primary/20"
        }`}
      >
        <p
          className={`mb-1 text-xs font-semibold ${isSupport ? "text-app-primary" : "text-ds-muted"}`}
        >
          {isSupport ? "Equipe Donyapp" : message.senderName}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ds-ink">{message.content}</p>
      </div>
      <p className="px-1 text-xs text-ds-subtle">{time}</p>
    </div>
  );
}
