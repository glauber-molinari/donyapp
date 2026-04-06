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
    <Modal open={open} onClose={onClose} title="Enviar material ao cliente" size="lg">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-sm text-ds-muted">
          Job: <span className="font-medium text-ds-ink">{jobName}</span>
        </p>

        {!isPro ? (
          <div
            className="rounded-ds-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-medium">Disponível no plano Pro</p>
            <p className="mt-1 text-amber-900/90">
              O envio de e-mail ao cliente está incluído no Pro.{" "}
              <Link href="/settings/kanban" className="font-medium text-ds-accent underline underline-offset-2">
                Ver planos em Configurações
              </Link>
              .
            </p>
          </div>
        ) : null}

        {isPro && !canConfigureReply ? (
          <div
            className="rounded-ds-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p>
              O reply-to usa o e-mail da sua conta Google. Confira se está correto no perfil do Google
              antes de enviar.
            </p>
          </div>
        ) : null}

        {isPro && canConfigureReply ? (
          <p className="text-xs text-ds-subtle">
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
          <p className="text-sm text-red-700" role="alert">
            {localError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
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
            {loading ? "Enviando…" : "Enviar e-mail"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
