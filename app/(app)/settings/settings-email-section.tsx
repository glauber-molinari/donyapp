"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveDeliveryEmailTemplates } from "./email-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDeliveryPlaceholders,
  DEFAULT_DELIVERY_BODY_TEMPLATE,
  defaultDeliverySubject,
} from "@/lib/email/apply-delivery-template";
import { toast } from "@/lib/toast";
import type { Plan } from "@/types/database";

const PLACEHOLDER_HELP = (
  <p className="text-xs text-ds-subtle">
    Você pode usar:{" "}
    <code className="rounded bg-ds-cream px-1 py-0.5 text-ds-muted">
      {"{{nome_cliente}} {{nome_job}} {{link_material}} {{nome_remetente}}"}
    </code>
  </p>
);

export function SettingsEmailSection({
  plan,
  isAdmin,
  initialSubject,
  initialBody,
}: {
  plan: Plan;
  isAdmin: boolean;
  initialSubject: string | null;
  initialBody: string | null;
}) {
  const router = useRouter();
  const isPro = plan === "pro";
  const [subject, setSubject] = useState(initialSubject ?? defaultDeliverySubject());
  const [body, setBody] = useState(initialBody ?? DEFAULT_DELIVERY_BODY_TEMPLATE);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro || !isAdmin) return;
    setErrorText(null);
    setBusy(true);
    const res = await saveDeliveryEmailTemplates(subject, body);
    setBusy(false);
    if (!res.ok) {
      setErrorText(res.error);
      return;
    }
    toast.success("Modelos de e-mail salvos. Serão usados ao enviar o material pelo quadro.");
    router.refresh();
  }

  function handleResetDefaults() {
    setSubject(defaultDeliverySubject());
    setBody(DEFAULT_DELIVERY_BODY_TEMPLATE);
    setErrorText(null);
  }

  const preview = applyDeliveryPlaceholders(body, {
    contactName: "Maria Souza",
    deliveryLink: "https://drive.google.com/exemplo",
    senderName: "João Fotógrafo",
    jobName: "Ensaio família",
  });

  if (!isAdmin) {
    return (
      <p className="text-sm text-ds-muted">
        Apenas administradores podem editar os modelos de e-mail.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!isPro ? (
          <div className="relative overflow-hidden rounded-lg border-2 border-ds-accent bg-gradient-to-br from-orange-50 to-orange-100/50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-ds-accent px-3 py-1.5 text-xs font-bold text-white">
                EXCLUSIVO PRO
              </span>
            </div>
          <h3 className="mb-2 text-lg font-bold text-orange-900">Templates Personalizados de E-mail</h3>
          <p className="mb-4 text-sm text-orange-800">
            Crie seus próprios modelos de e-mail com placeholders dinâmicos. Configure assunto e corpo da mensagem que serão usados automaticamente ao enviar o material para o cliente.
          </p>
          <div className="mb-4 rounded-lg bg-white/60 p-3">
            <p className="text-xs font-medium text-orange-900">✨ Recursos inclusos:</p>
            <ul className="mt-2 space-y-1 text-xs text-orange-800">
              <li>• Placeholders dinâmicos (nome, job, link, remetente)</li>
              <li>• Preview em tempo real</li>
              <li>• Modelos salvos para uso automático</li>
            </ul>
          </div>
          <a
            href="/settings/plan"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ds-accent hover:underline"
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
          </a>
        </div>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          id="email-template-subject"
          name="subject"
          label="Assunto padrão"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={!isPro || busy}
          required
        />
        {PLACEHOLDER_HELP}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-template-body" className="text-sm font-medium text-ds-ink">
            Corpo padrão (texto)
          </label>
          <Textarea
            id="email-template-body"
            name="body"
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!isPro || busy}
            required
            className="font-mono text-sm"
          />
          {PLACEHOLDER_HELP}
        </div>

        <Card className="border-dashed border-app-border bg-ds-cream/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ds-muted">Pré-visualização</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ds-ink">{preview}</p>
        </Card>

        {errorText ? (
          <p role="alert" className="text-sm text-red-700">
            {errorText}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="submit" disabled={!isPro || busy}>
            {busy ? "Salvando…" : "Salvar modelos"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!isPro || busy}
            onClick={handleResetDefaults}
          >
            Restaurar exemplo padrão
          </Button>
        </div>
      </form>
    </div>
  );
}
