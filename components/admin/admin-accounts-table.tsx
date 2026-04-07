"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adminGrantProCourtesyAction, adminRevokeProAction } from "@/app/admin/actions";
import { formatDatePtBr } from "@/lib/admin/format";
import type { AdminAccountRow } from "@/lib/admin/accounts";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/database";

type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];
type SubStatus = Database["public"]["Tables"]["subscriptions"]["Row"]["status"];

function planLabel(plan: Plan | undefined): string {
  return plan === "pro" ? "Pro" : "Free";
}

function statusLabel(s: SubStatus | undefined): string {
  switch (s) {
    case "active":
      return "Ativo";
    case "trialing":
      return "Teste";
    case "past_due":
      return "Atraso";
    case "canceled":
      return "Cancelado";
    default:
      return "—";
  }
}

export function AdminAccountsTable({ accounts }: { accounts: AdminAccountRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openGrant, setOpenGrant] = useState<string | null>(null);

  function runAction(
    fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    fd: FormData
  ) {
    startTransition(async () => {
      const r = await fn(fd);
      if (r.ok) {
        toast.success("Atualizado.");
        setOpenGrant(null);
        router.refresh();
      } else {
        toast.error(r.error ?? "Falha ao atualizar.");
      }
    });
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-ds-muted">
        Nenhuma conta encontrada. Ajuste a busca ou crie contas pelo app.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-ds-xl border border-app-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-app-border bg-ds-cream/80">
            <th className="px-3 py-2.5 font-medium text-ds-muted">Conta</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Membros</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Plano</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Status</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Renova / período</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Asaas</th>
            <th className="px-3 py-2.5 font-medium text-ds-muted">Ações</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => {
            const sub = a.subscription;
            const isPro = sub?.plan === "pro" && sub.status === "active";
            const asaas = sub?.asaas_subscription_id;

            return (
              <tr key={a.id} className="border-b border-app-border/80 hover:bg-ds-cream/40">
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-ds-ink">{a.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-ds-muted">{a.id}</div>
                  <div className="text-xs text-ds-muted">Criada {formatDatePtBr(a.created_at)}</div>
                </td>
                <td className="px-3 py-2 align-top tabular-nums">{a.memberCount}</td>
                <td className="px-3 py-2 align-top">{planLabel(sub?.plan)}</td>
                <td className="px-3 py-2 align-top">{statusLabel(sub?.status)}</td>
                <td className="px-3 py-2 align-top text-ds-muted">
                  {formatDatePtBr(sub?.current_period_ends_at ?? null)}
                </td>
                <td className="px-3 py-2 align-top">
                  {asaas ? (
                    <span className="text-xs text-ds-ink" title={asaas}>
                      Vinculado
                    </span>
                  ) : (
                    <span className="text-xs text-ds-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-col gap-2">
                    {!isPro ? (
                      <>
                        {openGrant === a.id ? (
                          <form
                            className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-canvas p-2"
                            action={(fd) => {
                              fd.set("accountId", a.id);
                              fd.set("clearAsaas", "true");
                              runAction(adminGrantProCourtesyAction, fd);
                            }}
                          >
                            <label className="text-xs text-ds-muted">
                              Meses de Pro (cortesia)
                              <select
                                name="mode"
                                className="mt-1 w-full rounded-ds-lg border border-app-border bg-app-sidebar px-2 py-1.5 text-sm text-ds-ink"
                                defaultValue="1"
                              >
                                {[1, 3, 6, 12].map((m) => (
                                  <option key={m} value={String(m)}>
                                    {m} {m === 1 ? "mês" : "meses"}
                                  </option>
                                ))}
                                <option value="custom">Data fixa…</option>
                              </select>
                            </label>
                            <label className="text-xs text-ds-muted">
                              Se “data fixa”: término
                              <input
                                type="date"
                                name="periodEnd"
                                className="mt-1 w-full rounded-ds-lg border border-app-border bg-app-sidebar px-2 py-1.5 text-sm text-ds-ink"
                              />
                            </label>
                            <p className="text-[11px] leading-snug text-ds-muted">
                              Remove o vínculo Asaas nesta conta para evitar conflito com webhooks. Se
                              houver cobrança ativa no Asaas, cancele lá também.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Button type="submit" size="sm" disabled={pending}>
                                Aplicar Pro
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenGrant(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() => setOpenGrant(a.id)}
                          >
                            Conceder Pro
                          </Button>
                        )}
                      </>
                    ) : (
                      <form
                        action={(fd) => {
                          fd.set("accountId", a.id);
                          runAction(adminRevokeProAction, fd);
                        }}
                      >
                        <Button type="submit" variant="danger" size="sm" disabled={pending}>
                          Voltar para Free
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
