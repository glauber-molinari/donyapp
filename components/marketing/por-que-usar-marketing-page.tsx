import Link from "next/link";

import { cn } from "@/lib/utils";
import { MarketingSiteHeader, marketingHomeAnchoredNavItems } from "@/components/marketing/marketing-site-header";

interface PorQueUsarMarketingPageProps {
  displayClassName: string;
  bodyClassName: string;
}

export function PorQueUsarMarketingPage({ displayClassName, bodyClassName }: PorQueUsarMarketingPageProps) {
  return (
    <div className={cn(bodyClassName, "min-h-screen bg-ds-cream text-ds-ink antialiased")}>
      <MarketingSiteHeader navItems={marketingHomeAnchoredNavItems} />

      <main>
        <section
          className="border-t border-ds-border bg-ds-surface/80 px-4 pb-16 pt-[9.5rem] sm:pt-[10rem] lg:scroll-mt-32 lg:pb-24 lg:pt-[11.25rem]"
          aria-labelledby="por-que-usar-heading"
        >
          <div className="mx-auto max-w-[1200px] sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-ds-subtle">
              <Link href="/" className="text-ds-muted underline-offset-2 transition hover:text-ds-ink hover:underline">
                Início
              </Link>
              <span aria-hidden className="mx-2 text-ds-border">
                /
              </span>
              <span className="text-ds-ink">Por que usar?</span>
            </p>
            <h1
              id="por-que-usar-heading"
              className={cn(
                displayClassName,
                "mt-6 max-w-3xl text-balance text-2xl font-extrabold tracking-tight text-ds-ink sm:text-3xl lg:text-[2.25rem]",
              )}
            >
              Por que usar o Donyapp?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ds-muted sm:text-lg">
              Feito para o fluxo real de pós-produção. Sem virar mais uma planilha paralela.
            </p>

            <div className="mt-12 divide-y divide-ds-border rounded-ds-card border border-ds-border-strong bg-ds-surface px-5 py-2 shadow-ds-sm sm:px-8 sm:py-4 lg:px-10 lg:py-6">
              <div className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-10 lg:py-12">
                <h2 className={cn(displayClassName, "text-xl font-bold tracking-tight text-ds-ink lg:col-span-4")}>
                  Resumo
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-ds-muted sm:text-base lg:col-span-8">
                  <p>
                    O Donyapp é gestão de pós-produção para fotógrafos e videomakers que vivem de prazo, revisão e
                    cliente no WhatsApp. Você organiza jobs num kanban que acompanha o fluxo real (do backup à
                    entrega), com contatos vinculados e prazos sempre visíveis.
                  </p>
                  <p>
                    Tudo fica na conta do seu estúdio (não preso a um único login quando você evolui para o plano com
                    equipe). E, por desenho,{" "}
                    <span className="font-medium text-ds-ink">não armazenamos seus arquivos</span>: você continua no
                    Drive, Dropbox, WeTransfer ou no serviço que já usa, e registra no job o link e o que importa para
                    a entrega.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-10 lg:py-12">
                <h2 className={cn(displayClassName, "text-xl font-bold tracking-tight text-ds-ink lg:col-span-4")}>
                  Fácil e rápido
                </h2>
                <div className="space-y-5 text-sm leading-relaxed text-ds-muted sm:text-base lg:col-span-8">
                  <p>
                    <span className="font-semibold text-ds-ink">Comece em minutos.</span> Acesso pelo navegador, sem
                    instalação, com login via Google. Na primeira entrada você já cadastra contatos e abre jobs com
                    tipo (foto, vídeo ou ambos) e data de entrega.
                  </p>
                  <p>
                    <span className="font-semibold text-ds-ink">Operação no dia a dia, sem atrito.</span> Busca em
                    contatos, cards no board com badges de prazo (próximo ou atrasado) e arrastar e soltar entre
                    colunas para refletir onde cada trabalho está. No painel inicial dá para ver de relance o que
                    pede atenção: ativos, atrasados, prazos curtos e entregas do mês.
                  </p>
                  <p>
                    <span className="font-semibold text-ds-ink">Quando o estúdio cresce.</span> No plano avançado,
                    etapas ilimitadas e personalizáveis, equipe com convites por e-mail e envio de e-mail ao cliente com
                    modelo editável ao concluir o job. Você confirma antes de disparar.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 py-10 lg:grid-cols-12 lg:gap-10 lg:py-12">
                <h2 className={cn(displayClassName, "text-xl font-bold tracking-tight text-ds-ink lg:col-span-4")}>
                  O que ajuda no dia a dia
                </h2>
                <div className="space-y-5 text-sm leading-relaxed text-ds-muted sm:text-base lg:col-span-8">
                  <p>
                    <span className="font-semibold text-ds-ink">Um quadro, uma verdade.</span> Todo mundo enxerga as
                    mesmas etapas, responsáveis e prazos. Menos &quot;cadê meu material?&quot; e menos planilha
                    divergindo entre as pessoas.
                  </p>
                  <p>
                    <span className="font-semibold text-ds-ink">Prazo como centro.</span> O produto foi desenhado em
                    torno de entrega e revisão: métricas de atraso e de curto prazo no dashboard, e colunas que você
                    adapta ao seu processo (inclusive etapa final configurável).
                  </p>
                  <p>
                    <span className="font-semibold text-ds-ink">Cliente amarrado ao job.</span> Contatos centralizados
                    e vinculados aos trabalhos deixam histórico e cobrança mais claros, sobretudo quando o volume sobe.
                  </p>
                  <p>
                    <span className="font-semibold text-ds-ink">Cresça sem trocar de ferramenta.</span> Plano gratuito
                    para validar o fluxo com limites claros; Pro para times, etapas ilimitadas e comunicação profissional
                    na entrega. Pagamento e assinatura ficam no próprio app, sem “módulos escondidos”.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 hover:shadow-md sm:w-auto"
              >
                Começar grátis
              </Link>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-ds-2xl border-[1.5px] border-ds-border bg-ds-surface px-7 py-3.5 text-sm font-semibold text-ds-ink transition duration-ds ease-out hover:border-stone-300 sm:w-auto"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
