"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { disconnectGoogleCalendar } from "./agenda-actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const ERROR_MESSAGES: Record<string, string> = {
  denied: "Autorização cancelada no Google.",
  invalid_request: "Resposta inválida do Google.",
  invalid_state: "Sessão de autorização expirou ou é inválida. Tente conectar novamente.",
  session: "Sua sessão não confere com a autorização. Entre de novo e tente outra vez.",
  forbidden: "Apenas administradores podem conectar a agenda.",
  config: "Servidor sem credenciais necessárias (verifique SUPABASE_SERVICE_ROLE_KEY).",
  server_config:
    "Integração Google incompleta no servidor (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_OAUTH_STATE_SECRET, NEXT_PUBLIC_APP_URL).",
  no_refresh:
    "O Google não enviou permissão contínua. Remova o acesso do app em myaccount.google.com/permissions e conecte de novo.",
  save: "Não foi possível salvar a integração no banco.",
  token: "Não foi possível concluir a troca de código com o Google.",
};

function pickParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export function SettingsAgendaSection({
  isAdmin,
  connected,
  googleEmail,
  integrationServerReady,
  searchParams,
}: {
  isAdmin: boolean;
  connected: boolean;
  googleEmail: string | null;
  integrationServerReady: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const flashSuccess = pickParam(searchParams.calendar_connected);
  const errKey = pickParam(searchParams.calendar_error);
  const flashError = errKey ? ERROR_MESSAGES[errKey] ?? "Não foi possível conectar." : null;

  if (!isAdmin) {
    return (
      <p className="text-sm text-ds-muted">
        Apenas administradores podem conectar ou alterar o Google Calendar da equipe. Todos os membros
        podem ver a página{" "}
        <Link href="/agenda" className="font-medium text-app-primary underline-offset-2 hover:underline">
          Agenda
        </Link>{" "}
        quando houver uma conta conectada.
      </p>
    );
  }

  async function handleDisconnect() {
    setBusy(true);
    const res = await disconnectGoogleCalendar();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Google Calendar desconectado.");
    router.replace("/settings/agenda");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {!integrationServerReady ? (
        <p className="rounded-ds-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          <strong className="font-semibold">Service role ausente.</strong> Defina{" "}
          <code className="rounded bg-red-100/80 px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> no
          servidor para salvar tokens com segurança (somente backend).
        </p>
      ) : null}

      {flashSuccess ? (
        <p
          className="rounded-ds-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          Conta Google conectada com sucesso. A equipe já pode usar a página Agenda.
        </p>
      ) : null}

      {flashError ? (
        <p className="rounded-ds-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {flashError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-ds-cream/40 px-4 py-4">
        <p className="text-sm font-medium text-ds-ink">Status</p>
        {connected ? (
          <p className="text-sm text-ds-muted">
            Conectado
            {googleEmail ? (
              <>
                {" "}
                como <span className="font-semibold text-ds-ink">{googleEmail}</span>
              </>
            ) : null}
            . Calendário principal (<code className="text-xs">primary</code>) é o usado na Agenda.
          </p>
        ) : (
          <p className="text-sm text-ds-muted">Nenhuma conta Google conectada.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          <a
            href="/api/integrations/google/authorize"
            className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-app-primary px-4 text-sm font-medium text-white shadow-sm transition-colors duration-ds ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
          >
            {connected ? "Trocar conta Google" : "Conectar conta Google"}
          </a>
          {connected ? (
            <Button type="button" variant="secondary" disabled={busy || !integrationServerReady} onClick={handleDisconnect}>
              {busy ? "Desconectando…" : "Desconectar"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
