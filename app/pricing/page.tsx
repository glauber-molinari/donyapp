import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, siteUrl } from "@/lib/agent/site";
import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
} from "@/lib/plan-limits";

const canonical = `${siteUrl()}/pricing`;

function formatBrl(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const proMonthly = formatBrl(PRO_PRICE_MONTHLY_CENTS);
const proYearly = formatBrl(PRO_PRICE_YEARLY_CENTS);
const proYearlyMonthly = formatBrl(Math.round(PRO_PRICE_YEARLY_CENTS / 12));
const yearlySavingsPercent = Math.max(
  0,
  Math.round((1 - PRO_PRICE_YEARLY_CENTS / (PRO_PRICE_MONTHLY_CENTS * 12)) * 100),
);

export const metadata: Metadata = {
  title: "Preços",
  description: `Planos Free e Pro do ${SITE_NAME}: limites, preços em reais e o que muda ao assinar.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Preços — ${SITE_NAME}`,
    description: `Free grátis. Pro a partir de ${proMonthly}/mês. Anual com ${yearlySavingsPercent}% de desconto.`,
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/features" className="text-ds-muted hover:text-ds-ink">
              Recursos
            </Link>
            <Link href="/about" className="text-ds-muted hover:text-ds-ink">
              Sobre
            </Link>
            <Link href="/login" className="font-semibold text-ds-ink hover:opacity-80">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Preços
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">
          Free para começar. Pro quando o estúdio precisa de equipe e volume.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ds-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Free — R$ 0 / mês</h2>
            <p>
              Conta individual, sem cartão. Serve para validar o fluxo com limites claros: até{" "}
              {FREE_MAX_ACTIVE_JOBS} jobs ativos no kanban, até {FREE_MAX_CONTACTS} contatos, até 4
              etapas (Backup → Em Edição → Em Aprovação → Entregue), anotações, agenda com Google
              Calendar, formulários para clientes e relatórios básicos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Pro — {proMonthly} / mês</h2>
            <p>
              Tudo do Free, sem teto de jobs e contatos. Etapas ilimitadas no kanban (criar,
              reordenar, renomear e marcar a etapa final). Convites de equipe por e-mail. Na
              entrega: e-mail automático ao cliente, WhatsApp direto do app e modelos de e-mail
              editáveis. Também entram histórico de alterações dos jobs, kanban de tarefas da
              equipe, relatórios avançados e board de álbum (entrega física).
            </p>
            <p>
              Pagamento do Pro com cartão de crédito, dentro do app após o login.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">
              Pro anual — {proYearly} / ano
            </h2>
            <p>
              Mesmos recursos do Pro mensal, com cerca de {yearlySavingsPercent}% de desconto no
              ano. Equivale a cerca de {proYearlyMonthly}/mês. Cobrança anual única no cartão.
            </p>
          </section>

          <p>
            Comparativo rápido na home em{" "}
            <Link href="/#planos" className="font-semibold text-ds-ink hover:underline">
              /#planos
            </Link>
            . Lista de recursos em{" "}
            <Link href="/features" className="font-semibold text-ds-ink hover:underline">
              /features
            </Link>
            . Conta nova em{" "}
            <Link href="/signup" className="font-semibold text-ds-ink hover:underline">
              /signup
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
