"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
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

/** Rótulo para o cliente — não usar a palavra "cancelado" para estados de assinatura. */
function customerPlanStatusLabel(
  plan: Plan,
  status: SubscriptionStatus,
  cancelAtPeriodEnd: boolean
): string {
  if (status === "past_due") {
    return "Pagamento em atraso";
  }
  if (plan === "free") {
    return "Ativo";
  }
  if (plan === "pro") {
    if (cancelAtPeriodEnd) {
      return "Ativo, sem renovação automática";
    }
    if (status === "trialing") {
      return "Período de teste";
    }
    return "Ativo";
  }
  return "Ativo";
}

export function SettingsPlanSection({
  plan,
  status,
  currentPeriodEndsAt,
  extraUsers,
  cancelAtPeriodEnd,
  canCancelSubscription,
  isAdmin,
  paymentSuccess,
}: {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEndsAt: string | null;
  extraUsers: number;
  cancelAtPeriodEnd: boolean;
  canCancelSubscription: boolean;
  isAdmin: boolean;
  paymentSuccess: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isPro = plan === "pro";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const waitingToastShown = useRef(false);
  const activationToastShown = useRef(false);

  /** Volta do checkout Asaas: webhook ativa o Pro; atualizamos a página até refletir no banco. */
  useEffect(() => {
    if (!paymentSuccess || isPro) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 2500);
    const stop = setTimeout(() => clearInterval(interval), 90_000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [paymentSuccess, isPro, router]);

  useEffect(() => {
    if (!paymentSuccess) return;

    if (!isPro) {
      if (!waitingToastShown.current) {
        waitingToastShown.current = true;
        toast.message("Pagamento recebido. Ativando o Pro… aguarde alguns segundos.", { duration: 6000 });
      }
      return;
    }

    if (!activationToastShown.current) {
      activationToastShown.current = true;
      toast.success("Plano Pro ativo. Os recursos já estão liberados.");
      window.history.replaceState(null, "", pathname || "/settings/plan");
    }
  }, [paymentSuccess, isPro, pathname]);

  useEffect(() => {
    if (!paymentSuccess || isPro) return;
    const t = setTimeout(() => {
      if (activationToastShown.current) return;
      toast.error(
        "Ainda não detectamos o Pro. Se o pagamento foi aprovado, aguarde alguns minutos ou fale com o suporte.",
        { duration: 10_000 }
      );
      window.history.replaceState(null, "", pathname || "/settings/plan");
    }, 90_000);
    return () => clearTimeout(t);
  }, [paymentSuccess, isPro, pathname]);

  const [cardBusy, setCardBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatBrlCents(PRO_PRICE_MONTHLY_CENTS);
  const yearlyLabel = formatBrlCents(PRO_PRICE_YEARLY_CENTS);

  function resetModal() {
    setError(null);
    setCardBusy(false);
  }

  function closeUpgrade() {
    setUpgradeOpen(false);
    resetModal();
  }

  function closeCancel() {
    setCancelOpen(false);
    setError(null);
  }

  async function handleCancelSubscription() {
    setError(null);
    setCancelBusy(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        return;
      }
      toast.success("Cancelamento agendado: você mantém o Pro até o fim do período já pago.");
      closeCancel();
      router.refresh();
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleCard(cycle: "MONTHLY" | "YEARLY") {
    setError(null);
    setCardBusy(true);
    try {
      const res = await fetch("/api/payment/card/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
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
          Free para começar. No Pro entram equipe, e-mail automático e limites maiores.
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
              Status:{" "}
              <span className="text-ds-ink">
                {customerPlanStatusLabel(plan, status, cancelAtPeriodEnd)}
              </span>
              {isPro && currentPeriodEndsAt && !cancelAtPeriodEnd ? (
                <>
                  {" "}
                  · Renova em {formatDatePt(currentPeriodEndsAt)}
                </>
              ) : null}
            </p>
            {isPro && cancelAtPeriodEnd && currentPeriodEndsAt ? (
              <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-950">
                Sua assinatura não será renovada. Você mantém o acesso Pro até{" "}
                <span className="font-medium">{formatDatePt(currentPeriodEndsAt)}</span>
                {`. Depois disso, a conta volta ao plano Free.`}
              </p>
            ) : null}
            {isPro && extraUsers > 0 ? (
              <p className="mt-2 text-sm text-ds-muted">
                Usuários adicionais registrados na assinatura:{" "}
                <span className="font-medium text-ds-ink">{extraUsers}</span>
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
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
                Assinar Pro ({priceLabel}/mês)
              </Button>
            ) : null}
            {isPro && canCancelSubscription ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full border-red-200 text-red-800 hover:bg-red-50 sm:w-auto"
                onClick={() => {
                  setError(null);
                  setCancelOpen(true);
                }}
              >
                Cancelar assinatura
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-medium text-ds-ink">Free</h3>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ds-muted">
            <li>Até {FREE_MAX_ACTIVE_JOBS} jobs ativos no kanban</li>
            <li>Até {FREE_MAX_CONTACTS} contatos</li>
            <li>Um usuário por conta</li>
          </ul>
        </Card>
        <Card className="border-ds-ink/10 bg-ds-cream/40 p-5">
          <h3 className="font-medium text-ds-ink">Pro</h3>
          <p className="mt-1 text-sm text-ds-muted">{priceLabel} por mês</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ds-muted">
            <li>Jobs e contatos ilimitados</li>
            <li>Equipe e convites por e-mail</li>
            <li>E-mail automático ao mover etapa (Resend)</li>
            <li>Pagamento via Asaas (cartão de crédito)</li>
          </ul>
        </Card>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-ds-muted">
          Somente administradores podem alterar o plano da conta.
        </p>
      ) : null}

      <Modal open={cancelOpen} onClose={closeCancel} title="Cancelar assinatura Pro" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ds-muted">
            A renovação automática será desativada. Você continua com todos os recursos Pro até o fim do
            período já pago
            {currentPeriodEndsAt ? ` (${formatDatePt(currentPeriodEndsAt)})` : ""}. Depois, a conta passa ao
            plano Free, sem cobranças futuras.
          </p>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeCancel}>
              Voltar
            </Button>
            <Button
              type="button"
              className="w-full bg-red-700 hover:bg-red-800 sm:w-auto"
              disabled={cancelBusy}
              onClick={() => void handleCancelSubscription()}
            >
              {cancelBusy ? "Processando…" : "Confirmar cancelamento"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={upgradeOpen} onClose={closeUpgrade} title="Assinar Pro" size="md">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ds-muted">
            Escolha o ciclo (mensal ou anual). Você será redirecionado ao checkout seguro da Asaas
            para pagar com cartão de crédito. Após a confirmação, o plano Pro é ativado
            automaticamente.
          </p>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="w-full"
              disabled={cardBusy}
              onClick={() => void handleCard("MONTHLY")}
            >
              {cardBusy ? "Abrindo…" : `Mensal (${priceLabel}/mês)`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={cardBusy}
              onClick={() => void handleCard("YEARLY")}
            >
              {cardBusy ? "Abrindo…" : `Anual (${yearlyLabel}/ano)`}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
