import type { Metadata } from "next";
import Link from "next/link";

import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/agent/site";
import { FREE_MAX_ACTIVE_JOBS, FREE_MAX_CONTACTS } from "@/lib/plan-limits";

const canonical = `${siteUrl()}/features`;

export const metadata: Metadata = {
  title: "Recursos",
  description: `O que o ${SITE_NAME} faz: kanban de edição, contatos, formulários, agenda, equipe e entrega.`,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `Recursos — ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink">
      <header className="border-b border-ds-border bg-ds-cream/70 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-ds-ink hover:opacity-80">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/pricing" className="text-ds-muted hover:text-ds-ink">
              Preços
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
          Recursos
        </h1>
        <p className="mt-3 text-sm text-ds-muted-2">
          Pós-produção em fila de trabalho — do backup ao entregue.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ds-muted">
          <p>
            O {SITE_NAME} é um app web para fotógrafos, videomakers e estúdios pequenos. A ideia é
            simples: cada job vira um card no kanban, com cliente, prazo e etapas que batem com o
            fluxo real. Não guarda arquivos de mídia; você cola o link do Drive, Dropbox ou
            WeTransfer na hora de entregar.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Fluxo em três passos</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ds-ink">Cadastre o job</span> — nome, cliente,
                prazo e tipo de entrega.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Mova pelas etapas</span> — arraste o card:
                Backup, Edição, Aprovação, Entregue (ou etapas que você configurar no Pro).
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Entregue ao cliente</span> — cole o link
                do material e, no Pro, dispare e-mail ou WhatsApp sem sair do app.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">O que está no produto</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ds-ink">Kanban de edição</span> — status visível
                para a equipe; no Free até 4 colunas, no Pro etapas ilimitadas.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Contatos</span> — clientes ligados aos
                jobs, com busca e histórico de entregas.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Formulários</span> — links públicos de
                briefing; respostas caem no workspace.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Agenda</span> — Google Calendar em modo
                leitura para a equipe ver compromissos junto dos jobs.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Anotações</span> — notas no contexto do
                estúdio, sem planilha paralela.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Equipe (Pro)</span> — convites por e-mail;
                board, contatos e agenda compartilhados na conta do estúdio.
              </li>
              <li>
                <span className="font-semibold text-ds-ink">Entrega (Pro)</span> — e-mail automático,
                WhatsApp, modelos editáveis, histórico de alterações, tarefas e relatórios
                avançados; board de álbum para entrega física.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ds-ink">Limites do Free</h2>
            <p>
              Até {FREE_MAX_ACTIVE_JOBS} jobs ativos e {FREE_MAX_CONTACTS} contatos, 1 usuário por
              conta. Detalhes de preço em{" "}
              <Link href="/pricing" className="font-semibold text-ds-ink hover:underline">
                /pricing
              </Link>
              . Conta em{" "}
              <Link href="/signup" className="font-semibold text-ds-ink hover:underline">
                /signup
              </Link>
              .
            </p>
          </section>

          <p>
            Não somos DAM, galeria pública nem CRM genérico. Se a pergunta é “quem edita o quê e
            quando entrega”, é isso que o {SITE_NAME} resolve. Mais contexto em{" "}
            <Link href="/about" className="font-semibold text-ds-ink hover:underline">
              /about
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
