import Link from "next/link";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LegalLinks } from "@/components/legal/legal-links";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const svc = createServiceRoleClient();
  if (!svc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-canvas px-4">
        <div className="max-w-md rounded-ds-xl border border-app-border bg-app-sidebar p-8 text-center shadow-ds-sm">
          <h1 className="text-xl font-bold text-ds-ink">Convite indisponível</h1>
          <p className="mt-2 text-sm text-ds-muted">
            O servidor não está configurado para validar convites (service role).
          </p>
        </div>
        <div className="mt-6 text-center text-xs text-ds-subtle">
          <LegalLinks linkClassName="text-ds-subtle hover:text-ds-ink" />
        </div>
      </div>
    );
  }

  const token = params.token?.trim() ?? "";
  const { data: inv } = await svc
    .from("invitations")
    .select("id, email, expires_at, accepted_at, accounts(name)")
    .eq("token", token)
    .maybeSingle();

  const expired = inv && new Date(inv.expires_at) <= new Date();
  const invalid = !inv || Boolean(inv.accepted_at) || expired;

  if (invalid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-canvas px-4">
        <div className="max-w-md rounded-ds-xl border border-app-border bg-app-sidebar p-8 text-center shadow-ds-sm">
          <h1 className="text-xl font-bold text-ds-ink">Convite inválido ou expirado</h1>
          <p className="mt-2 text-sm text-ds-muted">
            Peça um novo convite ao administrador da equipe.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-app-primary hover:brightness-95"
          >
            Voltar ao início
          </Link>
        </div>
        <div className="mt-6 text-center text-xs text-ds-subtle">
          <LegalLinks linkClassName="text-ds-subtle hover:text-ds-ink" />
        </div>
      </div>
    );
  }

  const acc = inv.accounts;
  const accountName =
    acc && typeof acc === "object" && "name" in acc && typeof (acc as { name: string }).name === "string"
      ? (acc as { name: string }).name
      : "Estúdio";

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-canvas px-4">
      <div className="max-w-md rounded-ds-xl border border-app-border bg-app-sidebar p-8 text-center shadow-ds-sm">
        <h1 className="text-xl font-bold text-ds-ink">Você foi convidado</h1>
        <p className="mt-3 text-sm text-ds-muted">
          Entre na conta <span className="font-semibold text-ds-ink">{accountName}</span> no dony.
        </p>
        <p className="mt-2 text-xs text-ds-subtle">
          Use a conta Google do e-mail <span className="font-medium text-ds-muted">{inv.email}</span>.
        </p>
        <Link
          href={loginHref}
          className="mt-8 inline-flex w-full items-center justify-center rounded-ds-xl bg-app-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          Entrar com Google
        </Link>
        <p className="mt-4 text-xs text-ds-subtle">
          Primeiro acesso? Após o Google, você entra direto na equipe.
        </p>
      </div>
      <div className="mt-6 text-center text-xs text-ds-subtle">
        <LegalLinks linkClassName="text-ds-subtle hover:text-ds-ink" />
      </div>
    </div>
  );
}
