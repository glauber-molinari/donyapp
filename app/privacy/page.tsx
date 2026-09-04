import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME, SUPPORT_EMAIL, siteUrl } from "@/lib/agent/site";

const canonical = `${siteUrl()}/privacy`;

export const metadata: Metadata = {
  title: "Privacidade",
  description: `Como o ${SITE_NAME} trata dados pessoais. Resumo em linguagem direta, com link à política completa.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Privacidade — ${SITE_NAME}`,
    description: `Dados de conta, workspace e cobrança. Contato: ${SUPPORT_EMAIL}.`,
  },
};

export default function PrivacyPage() {
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
            <Link href="/contact" className="text-ds-muted hover:text-ds-ink">
              Contato
            </Link>
            <Link
              href="/politica-de-privacidade"
              className="font-semibold text-ds-ink hover:opacity-80"
            >
              Política completa
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Privacidade
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">
          Resumo para pessoas e agentes. A versão jurídica está em português na política completa.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-ds-muted">
          <p>
            O {SITE_NAME} trata dados de conta (nome, e-mail, foto de perfil e identificadores de
            login), conteúdo que você coloca no workspace (contatos, jobs, prazos, notas, respostas
            de formulário), logs técnicos necessários para operar e proteger o serviço, e status de
            assinatura quando há plano pago. Dados sensíveis de cartão ficam com o provedor de
            pagamento; nós não guardamos o número completo do cartão nos nossos servidores.
          </p>
          <p>
            Usamos esses dados para autenticar, rodar o produto, cobrar planos, diagnosticar falhas e
            cumprir obrigações legais, inclusive a LGPD. Não vendemos lista de clientes do seu
            estúdio. Você pode pedir confirmação de tratamento, acesso, correção, exclusão e outros
            direitos previstos na lei pelo e-mail{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-ds-ink hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            O texto completo, com bases legais e detalhes de compartilhamento, está em{" "}
            <Link
              href="/politica-de-privacidade"
              className="font-semibold text-ds-ink hover:underline"
            >
              /politica-de-privacidade
            </Link>
            . Termos de uso:{" "}
            <Link href="/termos-de-servico" className="font-semibold text-ds-ink hover:underline">
              /termos-de-servico
            </Link>
            . Contato geral:{" "}
            <Link href="/contact" className="font-semibold text-ds-ink hover:underline">
              /contact
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
