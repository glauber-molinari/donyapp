"use client";

import { UserMinus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { removeTeamMember } from "./team-actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Database } from "@/types/database";

type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];
type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];

export type TeamMemberRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
};

function formatDatePt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function SettingsTeamSection({
  members,
  plan,
  isAdmin,
  currentUserId,
}: {
  members: TeamMemberRow[];
  plan: Plan;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const isPro = plan === "pro";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteBusy(true);
    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setInviteError(data.error ?? "Não foi possível enviar o convite.");
        return;
      }
      setInviteOpen(false);
      setInviteEmail("");
      toast.success("Convite enviado por e-mail.");
      router.refresh();
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleConfirmRemove() {
    if (!removeId) return;
    setRemoveBusy(true);
    const res = await removeTeamMember(removeId);
    setRemoveBusy(false);
    setRemoveId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Membro removido da equipe.");
    router.refresh();
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ds-ink">Equipe</h2>
          <p className="mt-1 text-sm text-ds-muted">
            Convide colaboradores por e-mail e gerencie o acesso à conta.
          </p>
        </div>
        <Button
          type="button"
          size="md"
          className="w-full sm:w-auto"
          disabled={!isPro}
          onClick={() => {
            setInviteError(null);
            setInviteOpen(true);
          }}
          title={!isPro ? "Disponível no plano Pro" : undefined}
        >
          Convidar membro
        </Button>
      </div>

      {!isPro ? (
        <p className="rounded-ds-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Multi-usuário e convites por e-mail estão no plano Pro.{" "}
          <Link href="/settings/plan" className="font-medium text-ds-ink underline underline-offset-2">
            Ver planos
          </Link>
        </p>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-app-border bg-ds-cream/90">
                <th className="px-4 py-3 font-medium text-ds-muted">Nome</th>
                <th className="px-4 py-3 font-medium text-ds-muted">E-mail</th>
                <th className="px-4 py-3 font-medium text-ds-muted">Papel</th>
                <th className="px-4 py-3 font-medium text-ds-muted">Desde</th>
                <th className="w-24 px-4 py-3 text-right font-medium text-ds-muted"> </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-ds-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ds-ink">{m.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ds-muted">{m.email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-ds-muted">
                    {m.role === "admin" ? "Administrador" : "Membro"}
                  </td>
                  <td className="px-4 py-3 text-ds-muted">{formatDatePt(m.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {m.id !== currentUserId && isPro ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        aria-label={`Remover ${m.name ?? m.email ?? "membro"}`}
                        onClick={() => {
                          setRemoveId(m.id);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar membro" size="md">
        <form className="flex flex-col gap-4" onSubmit={handleSendInvite}>
          <p className="text-sm text-ds-muted">
            Enviaremos um link válido por 48 horas. A pessoa deve entrar com a conta Google do mesmo
            e-mail.
          </p>
          <Input
            id="invite-email"
            name="email"
            type="email"
            label="E-mail"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="nome@email.com"
          />
          {inviteError ? (
            <p className="text-sm text-red-700" role="alert">
              {inviteError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviteBusy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={inviteBusy}>
              {inviteBusy ? "Enviando…" : "Enviar convite"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(removeId)}
        onClose={() => setRemoveId(null)}
        title="Remover membro"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ds-muted">
            O acesso à conta será revogado. Os dados do estúdio permanecem na conta.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setRemoveId(null)} disabled={removeBusy}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleConfirmRemove()} disabled={removeBusy}>
              {removeBusy ? "Removendo…" : "Remover"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
