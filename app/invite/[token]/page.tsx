import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvitationForNewUser } from "@/lib/auth/accept-invitation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LegalLinks } from "@/components/legal/legal-links";

export const dynamic = "force-dynamic";

function InviteShell({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ds-cream px-4">
      <div className="max-w-md rounded-ds-xl border border-ds-border bg-ds-surface p-8 text-center shadow-ds-sm">
        <h1 className="text-xl font-bold text-ds-ink">{title}</h1>
        <div className="mt-2 text-sm text-ds-muted">{children}</div>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
      <div className="mt-6 text-center text-xs text-ds-muted-2">
        <LegalLinks linkClassName="text-ds-muted-2 hover:text-ds-ink" />
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const svc = createServiceRoleClient();
  if (!svc) {
    return (
      <InviteShell title="Convite indisponível">
        <p>O servidor não está configurado para validar convites (service role).</p>
      </InviteShell>
    );
  }

  const token = params.token?.trim() ?? "";
  const { data: inv } = await svc
    .from("invitations")
    .select("id, account_id, email, expires_at, accepted_at, accounts(name)")
    .eq("token", token)
    .maybeSingle();

  const expired = inv && new Date(inv.expires_at) <= new Date();
  const invalid = !inv || Boolean(inv.accepted_at) || expired;

  if (invalid) {
    return (
      <InviteShell
        title="Convite inválido ou expirado"
        action={
          <Link
            href="/"
            className="inline-block text-sm font-medium text-ds-accent hover:brightness-95"
          >
            Voltar ao início
          </Link>
        }
      >
        <p>Peça um novo convite ao administrador da equipe.</p>
      </InviteShell>
    );
  }

  const acc = inv.accounts;
  const accountName =
    acc && typeof acc === "object" && "name" in acc && typeof (acc as { name: string }).name === "string"
      ? (acc as { name: string }).name
      : "Estúdio";

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;
  const signupHref = `/signup?next=${encodeURIComponent(`/invite/${token}`)}`;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: member } = await svc
      .from("account_members")
      .select("account_id")
      .eq("user_id", user.id)
      .eq("account_id", inv.account_id)
      .maybeSingle();

    if (member) {
      redirect("/dashboard");
    }

    const { data: existingUser } = await svc.from("users").select("id").eq("id", user.id).maybeSingle();

    if (!existingUser) {
      const accepted = await acceptInvitationForNewUser(svc, user, token);
      if (accepted.ok) {
        redirect("/dashboard");
      }

      const message =
        accepted.reason === "email"
          ? `Entre com o e-mail ${inv.email}, o mesmo que recebeu o convite.`
          : accepted.reason === "exists"
            ? "Esta conta já está cadastrada no Dony."
            : "Não foi possível aceitar o convite. Peça um novo ao administrador.";

      return (
        <InviteShell
          title="Não foi possível entrar na equipe"
          action={
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-ds-accent hover:brightness-95"
            >
              Ir para o login
            </Link>
          }
        >
          <p>{message}</p>
        </InviteShell>
      );
    }

    return (
      <InviteShell
        title="Conta já existente"
        action={
          <Link
            href="/dashboard"
            className="inline-block text-sm font-medium text-ds-accent hover:brightness-95"
          >
            Ir para o painel
          </Link>
        }
      >
        <p>
          O e-mail <span className="font-medium text-ds-ink">{user.email}</span> já tem um estúdio
          próprio no Dony. Para entrar na equipe de{" "}
          <span className="font-semibold text-ds-ink">{accountName}</span>, peça ao administrador
          que reenvie o convite e use outro e-mail, ou fale com o suporte.
        </p>
      </InviteShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ds-cream px-4">
      <div className="max-w-md rounded-ds-xl border border-ds-border bg-ds-surface p-8 text-center shadow-ds-sm">
        <h1 className="text-xl font-bold text-ds-ink">Você foi convidado</h1>
        <p className="mt-3 text-sm text-ds-muted">
          Entre na conta <span className="font-semibold text-ds-ink">{accountName}</span> no dony.
        </p>
        <p className="mt-2 text-xs text-ds-muted-2">
          Use o e-mail <span className="font-medium text-ds-muted">{inv.email}</span> para entrar.
        </p>
        <Link
          href={loginHref}
          className="mt-8 inline-flex w-full items-center justify-center rounded-ds-xl bg-ds-accent px-4 py-3 text-sm font-semibold text-white shadow-ds-sm transition hover:brightness-95"
        >
          Continuar
        </Link>
        <Link
          href={signupHref}
          className="mt-3 inline-flex w-full items-center justify-center rounded-ds-xl border border-ds-border bg-ds-surface px-4 py-3 text-sm font-semibold text-ds-ink transition hover:bg-ds-cream"
        >
          Criar conta com e-mail e senha
        </Link>
        <p className="mt-4 text-xs text-ds-muted-2">
          Você também pode entrar com Google na tela seguinte.
        </p>
      </div>
      <div className="mt-6 text-center text-xs text-ds-muted-2">
        <LegalLinks linkClassName="text-ds-muted-2 hover:text-ds-ink" />
      </div>
    </div>
  );
}
