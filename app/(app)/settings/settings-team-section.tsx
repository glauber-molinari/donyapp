"use client";

import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { removeTeamMember, cancelInvitation } from "./team-actions";
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

export type InvitationRow = {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
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

function getInvitationStatus(expiresAt: string): "expired" | "pending" {
  return new Date(expiresAt) <= new Date() ? "expired" : "pending";
}

export function SettingsTeamSection({
  members,
  invitations,
  plan,
  isAdmin,
  currentUserId,
}: {
  members: TeamMemberRow[];
  invitations: InvitationRow[];
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
  const [resendId, setResendId] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [cancelInvId, setCancelInvId] = useState<string | null>(null);
  const [cancelInvBusy, setCancelInvBusy] = useState(false);

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

  async function handleResendInvite() {
    if (!resendId) return;
    const inv = invitations.find((i) => i.id === resendId);
    if (!inv) return;
    setResendBusy(true);
    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inv.email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Não foi possível reenviar o convite.");
        return;
      }
      toast.success("Convite reenviado por e-mail.");
      setResendId(null);
      router.refresh();
    } finally {
      setResendBusy(false);
    }
  }

  async function handleCancelInvitation() {
    if (!cancelInvId) return;
    setCancelInvBusy(true);
    const res = await cancelInvitation(cancelInvId);
    setCancelInvBusy(false);
    setCancelInvId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Convite cancelado.");
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
        <div className="relative overflow-hidden rounded-lg border-2 border-ds-accent bg-gradient-to-br from-orange-50 to-orange-100/50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-ds-accent px-3 py-1.5 text-xs font-bold text-white">
              EXCLUSIVO PRO
            </span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-orange-900">Multi-usuário com Convites</h3>
          <p className="mb-4 text-sm text-orange-800">
            Convide colaboradores por e-mail para trabalhar na mesma conta. Todos os membros têm acesso completo ao painel e podem gerenciar edições, contatos e tarefas juntos.
          </p>
          <div className="mb-4 rounded-lg bg-white/60 p-3">
            <p className="text-xs font-medium text-orange-900">✨ Recursos inclusos:</p>
            <ul className="mt-2 space-y-1 text-xs text-orange-800">
              <li>• Convites ilimitados por e-mail</li>
              <li>• Gestão de papéis (Admin/Membro)</li>
              <li>• Acesso compartilhado em tempo real</li>
              <li>• Colaboração completa no quadro de edições</li>
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

      <Card className="overflow-hidden p-0">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ds-border bg-ds-cream/90">
              <th className="px-3 py-2 font-medium text-ds-muted text-xs">Nome</th>
              <th className="px-3 py-2 font-medium text-ds-muted text-xs">E-mail</th>
              <th className="px-3 py-2 font-medium text-ds-muted text-xs">Papel</th>
              <th className="px-3 py-2 font-medium text-ds-muted text-xs">Desde</th>
              <th className="px-3 py-2 text-right font-medium text-ds-muted text-xs"> </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-ds-border last:border-0">
                <td className="px-3 py-2 font-medium text-ds-ink text-xs truncate">{m.name ?? "—"}</td>
                <td className="px-3 py-2 text-ds-muted text-xs truncate">{m.email ?? "—"}</td>
                <td className="px-3 py-2 capitalize text-ds-muted text-xs whitespace-nowrap">
                  {m.role === "admin" ? "Admin" : "Membro"}
                </td>
                <td className="px-3 py-2 text-ds-muted text-xs whitespace-nowrap">{formatDatePt(m.created_at)}</td>
                <td className="px-3 py-2 text-right">
                  {m.id !== currentUserId && isPro ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-ds-danger hover:bg-ds-danger-soft"
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
      </Card>

      {invitations.length > 0 && (
        <div className="mt-8 flex flex-col gap-2">
          <div>
            <h3 className="text-lg font-semibold text-ds-ink">Convites Pendentes</h3>
            <p className="mt-1 text-sm text-ds-muted">
              Convites enviados e aguardando aceitação. Expiram em 48 horas.
            </p>
          </div>

          <Card className="overflow-hidden p-0">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ds-border bg-ds-cream/90">
                  <th className="px-3 py-2 font-medium text-ds-muted text-xs">E-mail</th>
                  <th className="px-3 py-2 font-medium text-ds-muted text-xs">Status</th>
                  <th className="px-3 py-2 font-medium text-ds-muted text-xs">Enviado</th>
                  <th className="px-3 py-2 font-medium text-ds-muted text-xs">Expira</th>
                  <th className="px-3 py-2 text-right font-medium text-ds-muted text-xs"> </th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const status = getInvitationStatus(inv.expires_at);
                  return (
                    <tr key={inv.id} className="border-b border-ds-border last:border-0">
                      <td className="px-3 py-2 font-medium text-ds-ink text-xs truncate">{inv.email}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status === "expired"
                            ? "bg-ds-danger-soft text-ds-danger"
                            : "bg-ds-warn-soft text-ds-warn"
                            }`}
                        >
                          {status === "expired" ? "Exp." : "Pend."}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ds-muted text-xs whitespace-nowrap">{formatDatePt(inv.created_at)}</td>
                      <td className="px-3 py-2 text-ds-muted text-xs whitespace-nowrap">{formatDatePt(inv.expires_at)}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-0 text-xs text-ds-accent hover:bg-ds-cream"
                            onClick={() => {
                              setResendId(inv.id);
                            }}
                            disabled={resendBusy}
                          >
                            Reenviar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1 text-xs text-ds-danger hover:bg-ds-danger-soft"
                            onClick={() => {
                              setCancelInvId(inv.id);
                            }}
                            disabled={cancelInvBusy}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar membro"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              disabled={inviteBusy}
            >
              Fechar
            </Button>
            <Button form="team-invite-form" type="submit" disabled={inviteBusy}>
              {inviteBusy ? "Enviando…" : "Enviar convite"}
            </Button>
          </div>
        }
      >
        <form id="team-invite-form" className="flex flex-col gap-4 p-5" onSubmit={handleSendInvite}>
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
            <p className="text-sm text-ds-danger" role="alert">
              {inviteError}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(removeId)}
        onClose={() => setRemoveId(null)}
        title="Remover membro"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRemoveId(null)}
              disabled={removeBusy}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleConfirmRemove()}
              disabled={removeBusy}
            >
              {removeBusy ? "Removendo…" : "Remover"}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <p className="text-sm text-ds-muted">
            O acesso à conta será revogado. Os dados do estúdio permanecem na conta.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(resendId)}
        onClose={() => setResendId(null)}
        title="Reenviar convite"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setResendId(null)}
              disabled={resendBusy}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => void handleResendInvite()}
              disabled={resendBusy}
            >
              {resendBusy ? "Reenviando…" : "Reenviar"}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <p className="text-sm text-ds-muted">
            Enviaremos um novo link de convite válido por 48 horas.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(cancelInvId)}
        onClose={() => setCancelInvId(null)}
        title="Cancelar convite"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelInvId(null)}
              disabled={cancelInvBusy}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleCancelInvitation()}
              disabled={cancelInvBusy}
            >
              {cancelInvBusy ? "Cancelando…" : "Cancelar"}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <p className="text-sm text-ds-muted">
            O convite será removido e não poderá mais ser aceito. A pessoa precisará de um novo convite.
          </p>
        </div>
      </Modal>
    </section>
  );
}
