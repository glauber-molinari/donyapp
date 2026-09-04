import type { Metadata } from "next";
import Link from "next/link";

import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/agent/site";

const canonical = `${siteUrl()}/about`;

export const metadata: Metadata = {
  title: "Sobre",
  description: `O que é o ${SITE_NAME}: gestão de pós-produção para fotógrafos e videomakers.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Sobre o ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/contact" className="text-ds-muted hover:text-ds-ink">
              Contato
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
          Sobre o {SITE_NAME}
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">Gestão de pós-produção, sem enrolação.</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-ds-muted">
          <p>
            O {SITE_NAME} é um app web para fotógrafos, videomakers e estúdios pequenos que precisam
            organizar a pós-produção como fila de trabalho — não como pasta solta no Drive. Cada job
            vira um card no kanban, com cliente vinculado, prazo à vista e etapas que batem com o
            fluxo real: do backup à entrega.
          </p>
          <p>
            A gente viu muita gente perdendo prazo porque o status do job vivia no WhatsApp, no
            caderno ou numa planilha que ninguém atualiza. O produto concentra contatos, board,
            formulários de briefing e agenda num workspace só. No plano Free você começa sozinho; no
            Pro a equipe entra no mesmo quadro.
          </p>
          <p>
            Não somos DAM, galeria pública nem CRM genérico. Se o problema é “quem está editando o
            quê e quando entrega”, é pra isso que o {SITE_NAME} existe. Conta nova em{" "}
            <Link href="/signup" className="font-semibold text-ds-ink hover:underline">
              /signup
            </Link>
            ; dúvidas em{" "}
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
