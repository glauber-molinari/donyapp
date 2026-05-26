"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDeliveryPlaceholders,
  buildFallbackDeliveryBody,
  defaultDeliverySubject,
} from "@/lib/email/apply-delivery-template";
import type { Plan } from "@/types/database";

export interface DeliveryEmailModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  deliveryLink: string | null;
  plan: Plan;
  senderName: string | null;
  replyToEmail: string | null;
  /** Modelos salvos em Configurações → E-mail (Pro). */
  accountSubjectTemplate: string | null;
  accountBodyTemplate: string | null;
}

function resolveInitialSubject(
  accountTemplate: string | null,
  vars: Parameters<typeof applyDeliveryPlaceholders>[1]
): string {
  if (accountTemplate?.trim()) {
    return applyDeliveryPlaceholders(accountTemplate.trim(), vars);
  }
  return defaultDeliverySubject();
}

function resolveInitialBody(
  accountTemplate: string | null,
  vars: Parameters<typeof applyDeliveryPlaceholders>[1]
): string {
  if (accountTemplate?.trim()) {
    return applyDeliveryPlaceholders(accountTemplate.trim(), vars);
  }
  return buildFallbackDeliveryBody({
    contactName: vars.contactName,
    deliveryLink: vars.deliveryLink,
    senderName: vars.senderName,
    jobName: vars.jobName,
  });
}

export function DeliveryEmailModal({
  open,
  onClose,
  onSuccess,
  jobName,
  contactName,
  contactEmail,
  contactPhone,
  deliveryLink,
  plan,
  senderName,
  replyToEmail,
  accountSubjectTemplate,
  accountBodyTemplate,
}: DeliveryEmailModalProps) {
  const [subject, setSubject] = useState(defaultDeliverySubject());
  const [body, setBody] = useState("");
  const [to, setTo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = plan === "pro";
  const canConfigureReply = Boolean(replyToEmail?.trim());

  function buildWhatsAppUrl(): string {
    const text = encodeURIComponent(body.trim());
    const phone = contactPhone ? contactPhone.replace(/\D/g, "") : "";
    const base = "https://web.whatsapp.com/send";
    return phone ? `${base}?phone=${phone}&text=${text}` : `${base}?text=${text}`;
  }

  useEffect(() => {
    if (!open) return;
    const vars = {
      contactName,
      deliveryLink,
      senderName,
      jobName,
    };
    setSubject(resolveInitialSubject(accountSubjectTemplate, vars));
    setBody(resolveInitialBody(accountBodyTemplate, vars));
    setTo((contactEmail ?? "").trim());
    setLocalError(null);
    setLoading(false);
  }, [
    open,
    contactName,
    contactEmail,
    deliveryLink,
    senderName,
    jobName,
    accountSubjectTemplate,
    accountBodyTemplate,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!isPro) {
      setLocalError("Faça upgrade para o plano Pro para enviar e-mails ao cliente.");
      return;
    }
    if (!canConfigureReply) {
      setLocalError("Defina seu e-mail em Configurações → Perfil para usar como resposta ao cliente.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          bodyText: body.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; code?: string };
      if (!res.ok || !data.ok) {
        setLocalError(data.error ?? "Não foi possível enviar o e-mail.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setLocalError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar material ao cliente"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Fechar
          </Button>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-ds-xl bg-[#25D366] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
            title={contactPhone ? `Abrir conversa com ${contactPhone}` : "Abrir WhatsApp Web com mensagem"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Enviar por WhatsApp
          </a>
          <Button
            form="delivery-email-form"
            type="submit"
            disabled={loading || !isPro || !canConfigureReply}
            title={
              !isPro
                ? "Requer plano Pro"
                : !canConfigureReply
                  ? "Defina seu e-mail em Configurações"
                  : undefined
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {loading ? "Enviando…" : "Enviar e-mail"}
          </Button>
        </div>
      }
    >
      <form id="delivery-email-form" className="flex flex-col gap-4 p-5" onSubmit={handleSubmit}>
        <p className="text-sm text-ds-muted">
          Job: <span className="font-medium text-ds-ink">{jobName}</span>
        </p>

        {!isPro ? (
          <div
            className="rounded-lg border-2 border-ds-accent bg-gradient-to-br from-orange-50 to-orange-100/50 px-5 py-4 text-sm"
            role="status"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-ds-accent px-2.5 py-1 text-xs font-bold text-white">
                EXCLUSIVO PRO
              </span>
            </div>
            <p className="font-semibold text-orange-900">Envio de e-mail automático ao cliente</p>
            <p className="mt-2 text-orange-800">
              Envie o link de entrega diretamente do Donyapp para o e-mail do cliente, com templates personalizados e reply-to configurável.
            </p>
            <Link
              href="/settings/plan"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ds-accent hover:underline"
            >
              Fazer upgrade para PRO
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : null}

        {isPro && !canConfigureReply ? (
          <div
            className="rounded-ds-lg border border-ds-warn/30 bg-ds-warn-soft px-4 py-3 text-sm text-ds-ink"
            role="status"
          >
            <p>
              O reply-to usa o e-mail da sua conta Google. Confira se está correto no perfil do Google
              antes de enviar.
            </p>
          </div>
        ) : null}

        {isPro && canConfigureReply ? (
          <p className="text-xs text-ds-muted-2">
            Respostas do cliente serão enviadas para:{" "}
            <span className="font-medium text-ds-muted">{replyToEmail}</span>
          </p>
        ) : null}

        <Input
          id="delivery-email-to"
          name="to"
          type="email"
          label="Para (e-mail do cliente)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          autoComplete="email"
          placeholder="cliente@email.com"
        />

        <Input
          id="delivery-email-subject"
          name="subject"
          label="Assunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <Textarea
          id="delivery-email-body"
          name="body"
          label="Mensagem"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />

        {localError ? (
          <p className="text-sm text-ds-danger" role="alert">
            {localError}
          </p>
        ) : null}

      </form>
    </Modal>
  );
}
