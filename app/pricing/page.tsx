import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { headers } from "next/headers";

import { WebMcpSurface } from "@/components/agent/webmcp-surface";
import { canonicalSiteUrl, SITE_NAME } from "@/lib/agent/site";
import { FREE_MAX_ACTIVE_JOBS, FREE_MAX_CONTACTS } from "@/lib/plan-limits";

const canonical = `${canonicalSiteUrl()}/pricing`;

export const metadata: Metadata = {
  title: "Planos",
  description: `Free para começar. Os 20 primeiros convidados do ${SITE_NAME} ganham o Pro vitalício, sem cobrança.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Planos — ${SITE_NAME}`,
    description: "Free para começar. Os 20 primeiros convidados ganham o Pro vitalício, sem cobrança.",
  },
};

export default async function PricingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <Script src="/webmcp-register.js" strategy="afterInteractive" nonce={nonce} />
      <WebMcpSurface />
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
          Planos
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">
          Free para começar. Os 20 primeiros convidados ganham o Pro vitalício.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ds-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Free</h2>
            <p>
              Conta individual, sem cartão. Serve para validar o fluxo com limites claros: até{" "}
              {FREE_MAX_ACTIVE_JOBS} jobs ativos no kanban, até {FREE_MAX_CONTACTS} contatos, até 4
              etapas (Backup → Em Edição → Em Aprovação → Entregue), anotações, agenda com Google
              Calendar, formulários para clientes e relatórios básicos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Pro vitalício</h2>
            <p>
              Para os 20 primeiros convidados. Crie a conta e o Pro é liberado sem data para acabar,
              sem cobrança e sem renovação.
            </p>
            <p>
              Tudo do Free, sem teto de jobs e contatos. Etapas ilimitadas no kanban (criar,
              reordenar, renomear e marcar a etapa final). Convites de equipe por e-mail. Na
              entrega: e-mail automático ao cliente, WhatsApp direto do app e modelos de e-mail
              editáveis. Também entram histórico de alterações dos jobs, kanban de tarefas da
              equipe, relatórios avançados e board de álbum (entrega física).
            </p>
          </section>

          <p>
            Lista de recursos em{" "}
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
