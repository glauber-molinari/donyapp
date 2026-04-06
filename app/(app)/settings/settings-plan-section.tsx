"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
} from "@/lib/plan-limits";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/database";

type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];
type SubscriptionStatus = Database["public"]["Tables"]["subscriptions"]["Row"]["status"];

function formatBrlCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDatePt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusLabel(s: SubscriptionStatus): string {
  switch (s) {
    case "active":
      return "Ativo";
    case "trialing":
      return "Período de teste";
    case "past_due":
      return "Pagamento em atraso";
    case "canceled":
      return "Cancelado";
    default:
      return s;
  }
}

export function SettingsPlanSection({
  plan,
  status,
  currentPeriodEndsAt,
  extraUsers,
  isAdmin,
  paymentSuccess,
}: {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEndsAt: string | null;
  extraUsers: number;
  isAdmin: boolean;
  paymentSuccess: boolean;
}) {
  const isPro = plan === "pro";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const paymentToastShown = useRef(false);

  useEffect(() => {
    if (!paymentSuccess || paymentToastShown.current) return;
    paymentToastShown.current = true;
    toast.success(
      "Pagamento recebido. Se o plano ainda não aparecer como Pro, aguarde alguns segundos e atualize a página.",
      { duration: 9000 }
    );
  }, [paymentSuccess]);
  const [cardBusy, setCardBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatBrlCents(PRO_PRICE_MONTHLY_CENTS);

  function resetModal() {
    setError(null);
    setCardBusy(false);
  }

  function closeUpgrade() {
    setUpgradeOpen(false);
    resetModal();
  }

  /** Fecha o modal e recarrega a página para buscar plano atualizado (router.refresh() sozinho não fecha o modal nem garante dados novos). */
  function handlePaidRefresh() {
    closeUpgrade();
    const url = `${window.location.pathname}${window.location.search}`;
    window.location.assign(url);
  }

  async function handleCard() {
    setError(null);
    setCardBusy(true);
    try {
      const res = await fetch("/api/payment/card/create", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string; url?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Não foi possível abrir o pagamento.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setCardBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Plano e limites</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Free para começar; Pro desbloqueia equipe, e-mail automático e limites maiores.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ds-muted">Plano atual</p>
            <p className="mt-1 text-xl font-semibold text-ds-ink">
              {isPro ? "Pro" : "Free"}
            </p>
            <p className="mt-2 text-sm text-ds-muted">
              Status: <span className="text-ds-ink">{statusLabel(status)}</span>
              {isPro && currentPeriodEndsAt ? (
                <>
                  {" "}
                  · Renova em {formatDatePt(currentPeriodEndsAt)}
                </>
              ) : null}
            </p>
            {isPro && extraUsers > 0 ? (
              <p className="mt-2 text-sm text-ds-muted">
                Usuários adicionais registrados na assinatura:{" "}
                <span className="font-medium text-ds-ink">{extraUsers}</span>
              </p>
            ) : null}
          </div>
          {!isPro && isAdmin ? (
            <Button
              type="button"
              size="md"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => {
                resetModal();
                setUpgradeOpen(true);
              }}
            >
              Assinar Pro — {priceLabel}/mês
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-medium text-ds-ink">Free</h3>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ds-muted">
            <li>Até {FREE_MAX_ACTIVE_JOBS} oportunidades ativas no funil</li>
            <li>Até {FREE_MAX_CONTACTS} contatos</li>
            <li>Um usuário por conta</li>
          </ul>
        </Card>
        <Card className="border-ds-ink/10 bg-ds-cream/40 p-5">
          <h3 className="font-medium text-ds-ink">Pro</h3>
          <p className="mt-1 text-sm text-ds-muted">{priceLabel} por mês</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ds-muted">
            <li>Oportunidades e contatos ilimitados</li>
            <li>Equipe e convites por e-mail</li>
            <li>E-mail automático ao mover etapa (Resend)</li>
            <li>Pagamento via Asaas (cartão ou link de pagamento)</li>
          </ul>
        </Card>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-ds-muted">
          Somente administradores podem alterar o plano da conta.
        </p>
      ) : null}

      <Modal open={upgradeOpen} onClose={closeUpgrade} title="Assinar Pro" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ds-muted">
            Valor: <span className="font-medium text-ds-ink">{priceLabel}</span> / mês. Você será
            redirecionado para o checkout seguro da Asaas. Após a confirmação, o plano Pro é ativado
            automaticamente.
          </p>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={cardBusy}
            onClick={() => void handleCard()}
          >
            {cardBusy ? "Abrindo…" : "Pagar com cartão ou link"}
          </Button>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => handlePaidRefresh()}>
              Já paguei — atualizar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
