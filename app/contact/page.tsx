import type { Metadata } from "next";
import Link from "next/link";

import { INSTAGRAM_URL, SITE_NAME, SUPPORT_EMAIL, siteUrl } from "@/lib/agent/site";

const canonical = `${siteUrl()}/contact`;

export const metadata: Metadata = {
  title: "Contato",
  description: `Fale com o time do ${SITE_NAME}: suporte, cobrança e pedidos de privacidade.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Contato — ${SITE_NAME}`,
    description: `E-mail de suporte: ${SUPPORT_EMAIL}`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/about" className="text-ds-muted hover:text-ds-ink">
              Sobre
            </Link>
            <Link href="/privacy" className="text-ds-muted hover:text-ds-ink">
              Privacidade
            </Link>
            <Link href="/login" className="font-semibold text-ds-ink hover:opacity-80">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Contato
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">
          Suporte, cobrança, privacidade e correções sobre o site.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-ds-muted">
          <p>
            O canal oficial é o e-mail{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-ds-ink hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            . Use esse endereço para problema técnico, dúvida de plano, pedido de exclusão ou acesso
            a dados (LGPD), ou se um agente/crawler encontrou informação errada nas páginas públicas.
          </p>
          <p>
            Se você já tem conta, abra{" "}
            <Link href="/support" className="font-semibold text-ds-ink hover:underline">
              Suporte
            </Link>{" "}
            dentro do app depois de entrar — fica o histórico do ticket junto da conta. Fora do
            horário comercial a resposta pode demorar um dia útil; inclua o e-mail da conta e o que
            você tentou fazer, sem senha nem cartão no corpo da mensagem.
          </p>
          <p>
            Redes:{" "}
            <a
              href={INSTAGRAM_URL}
              className="font-semibold text-ds-ink hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Instagram @dony__app
            </a>
            . Não usamos o Direct como canal de suporte de cobrança ou dados pessoais.
          </p>
        </div>
      </main>
    </div>
  );
}
