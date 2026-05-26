import { ArrowRight, Camera, Check, ChevronRight, Columns3, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { LegalLinks } from "@/components/legal/legal-links";
import { MarketingSiteHeader, marketingLandingNavItems } from "@/components/marketing/marketing-site-header";
import {
  FREE_MAX_ACTIVE_JOBS,
  FREE_MAX_CONTACTS,
  PRO_PRICE_MONTHLY_CENTS,
  PRO_PRICE_YEARLY_CENTS,
  PRO_PRICE_ORIGINAL_MONTHLY_CENTS,
  PRO_PRICE_ORIGINAL_YEARLY_CENTS,
} from "@/lib/plan-limits";

function ProductPreviewMock() {
  return (
    <div
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-t-lg border border-ds-border bg-ds-surface shadow-ds-card sm:rounded-t-ds-card"
      aria-hidden
    >
      <div className="relative h-[min(260px,38vh)] w-full sm:h-[min(400px,55vh)]">
        <Image
          src="/marketing/kanban-oficial.png"
          alt=""
          fill
          unoptimized
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-contain object-top sm:object-cover"
        />
      </div>
    </div>
  );
}

interface LandingPageProps {
  displayClassName: string;
  bodyClassName: string;
}

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function LandingPage({ displayClassName, bodyClassName }: LandingPageProps) {
  const proMonthly = PRO_PRICE_MONTHLY_CENTS / 100;
  const proYearly = PRO_PRICE_YEARLY_CENTS / 100;
  const proOriginalMonthly = PRO_PRICE_ORIGINAL_MONTHLY_CENTS / 100;
  const proOriginalYearly = PRO_PRICE_ORIGINAL_YEARLY_CENTS / 100;
  const yearlySavingsPercent = Math.max(
    0,
    Math.round((1 - proYearly / (proMonthly * 12)) * 100),
  );
  return (
    <div className={cn(bodyClassName, "min-h-screen bg-ds-cream text-ds-ink antialiased")}>
      <MarketingSiteHeader navItems={marketingLandingNavItems} />

      <main>
        <section className="bg-ds-cream px-4 pb-0 pt-[9.5rem] sm:pt-[10rem] lg:pt-[11.25rem]">
          <div className="mx-auto max-w-[1200px] text-center">
            <Link
              href="/login"
              className="group mb-8 inline-flex items-center gap-2 rounded-full bg-ds-accent px-1 py-1 pl-1.5 pr-3 text-[0.75rem] font-semibold text-white transition duration-ds ease-out hover:brightness-110 sm:mb-10"
            >
              <span className="pr-1">Pós-produção, sem caos</span>
            </Link>

            <h1
              className={cn(
                displayClassName,
                "mx-auto max-w-4x2 text-balance font-black leading-[1.05] tracking-[-0.03em] text-ds-ink [font-size:clamp(2.75rem,5vw,5.5rem)] sm:leading-[1.08]",
              )}
            >
              Seu fluxo de edição,
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              <span className="text-[#ff5500]">do backup ao entregue</span>.
            </h1>

            <p className="mx-auto mt-8 max-w-[55ch] text-pretty text-center text-lg leading-relaxed text-ds-muted sm:text-xl">
              <span className="font-medium text-ds-ink">Cada entrega atrasada custa confiança e tempo.</span> <br /> Um
              kanban feito para fotógrafos e videomakers: prazos claros, clientes organizados e a equipe alinhada,
              sem planilhas nem ferramentas genéricas.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 hover:shadow-md sm:w-auto"
              >
                Começar grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/por-que-usar"
                className="inline-flex w-full items-center justify-center text-sm font-semibold text-ds-ink underline decoration-ds-border underline-offset-[0.35em] transition duration-ds ease-out hover:decoration-ds-ink sm:w-auto sm:justify-center sm:px-2 sm:py-3.5"
              >
                Por que usar?
              </Link>
            </div>
            <p className="mt-5 text-sm text-ds-muted-2">Plano gratuito para começar. Sem cartão.</p>
          </div>

          <div className="relative mx-auto mt-14 max-w-[1200px] sm:mt-20">
            <div className="relative -mb-px overflow-hidden px-0 sm:px-4 lg:px-8">
              {/* Degradê fade de baixo: mobile com fade mais alto e suave, desktop mantém padrão */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[min(65%,13rem)] bg-gradient-to-t from-ds-cream via-ds-cream/60 to-transparent from-[25%] via-[55%] sm:h-32 sm:from-10% sm:via-transparent" />
              <ProductPreviewMock />
            </div>
          </div>
        </section>

        <section className="border-t border-ds-border bg-ds-surface/60 py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                displayClassName,
                "mx-auto max-w-2xl text-center text-balance text-2xl font-extrabold tracking-tight text-ds-ink sm:text-3xl",
              )}
            >
              Do caos ao entregue em três passos
            </h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Cadastre o job",
                  text: "Nome, cliente, prazo e tipo de entrega. Tudo em segundos, sem campos desnecessários.",
                },
                {
                  step: "02",
                  title: "Mova pelas etapas",
                  text: "Arraste o card pelo kanban: Backup, Edição, Aprovação e Entregue. Todos na equipe enxergam o mesmo estado.",
                },
                {
                  step: "03",
                  title: "Entregue ao cliente",
                  text: "Cole o link do Drive, Dropbox ou WeTransfer e dispare por e-mail automático ou WhatsApp direto do app.",
                },
              ].map(({ step, title, text }) => (
                <li key={step} className="relative flex flex-col gap-3 rounded-ds-card border border-ds-border bg-white p-6 shadow-ds-sm">
                  <span className="text-[2.5rem] font-black leading-none tracking-tight text-ds-accent">
                    {step}
                  </span>
                  <h3 className="text-base font-bold text-ds-ink">{title}</h3>
                  <p className="text-sm leading-relaxed text-ds-muted">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-xs text-ds-muted-2">
              Funciona com Google Drive, Dropbox, WeTransfer e qualquer link de entrega.
            </p>
          </div>
        </section>

        <section
          id="sobre"
          className="scroll-mt-28 border-t border-ds-border bg-ds-cream py-20 lg:scroll-mt-32 lg:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                displayClassName,
                "mx-auto max-w-3xl text-center text-balance text-3xl font-extrabold tracking-tight text-ds-ink sm:text-4xl lg:text-[2.75rem]",
              )}
            >
              Kanban, clientes e prazo no mesmo lugar
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-center text-lg text-ds-muted">
              Pensado para quem vive de prazo, revisão e cliente no WhatsApp.
            </p>
            <ul className="mt-14 grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: Columns3,
                  title: "Kanban de edição",
                  text: "Colunas que acompanham o fluxo real: aguardando, edição, revisão e entrega.",
                },
                {
                  icon: UsersRound,
                  title: "Contatos centralizados",
                  text: "Clientes vinculados aos jobs, com busca rápida e histórico organizado.",
                },
                {
                  icon: Camera,
                  title: "Feito para criativos",
                  text: "Visual calmo, tons pastéis e foco no que importa: entregar no tempo.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="rounded-ds-card border border-ds-border-strong bg-ds-surface p-6 shadow-ds-sm transition duration-ds ease-out hover:shadow-ds-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-ds-2xl border border-ds-border bg-ds-cream text-ds-ink">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-bold text-ds-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ds-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="prova"
          className="scroll-mt-28 border-t border-ds-border bg-ds-surface/80 py-16 lg:scroll-mt-32 lg:py-20"
        >
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                displayClassName,
                "mx-auto max-w-3xl text-center text-balance text-2xl font-extrabold tracking-tight text-ds-ink sm:text-3xl",
              )}
            >
              Para quem não pode errar o prazo
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-ds-muted sm:text-lg">
              Menos “Quando eu recebo o material?” no WhatsApp. Mais previsibilidade com prazos,
              responsáveis e etapas claras para todos visualizarem.
            </p>
            <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="flex h-full flex-col justify-between rounded-ds-card bg-ds-ink p-8 shadow-ds-sm">
                <p className="text-base font-bold text-white">Reconhece algum desses?</p>
                <ul className="mt-6 space-y-4">
                  {[
                    '"Quando fica pronto?" no WhatsApp do cliente',
                    "Planilha desatualizada que ninguém confia",
                    "Prazo perdido porque estava num post-it",
                    "Entrega feita sem avisar o cliente",
                  ].map((pain) => (
                    <li key={pain} className="flex items-start gap-3 text-sm text-white/65">
                      <span className="mt-0.5 shrink-0 font-bold text-red-400" aria-hidden>
                        ✕
                      </span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-sm font-semibold text-ds-accent">
                  O Donyapp resolve cada um deles.
                </p>
              </div>
              <ul className="flex h-full flex-col justify-center gap-6 rounded-ds-card border border-ds-border-strong bg-white p-8 shadow-ds-sm">
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-2xl border border-ds-border bg-ds-cream text-ds-accent-ink">
                    <Columns3 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ds-ink">Status sempre visível</p>
                    <p className="mt-1 text-sm leading-relaxed text-ds-muted">
                      Prazos, etapas e responsáveis no mesmo lugar. Toda a equipe enxerga a mesma realidade, em tempo real.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-2xl border border-ds-border bg-ds-cream text-ds-accent-ink">
                    <UsersRound className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ds-ink">Cresce com seu estúdio</p>
                    <p className="mt-1 text-sm leading-relaxed text-ds-muted">
                      Comece sozinho e convide a equipe quando precisar. Mais jobs, mais contatos, sem virar bagunça.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-2xl border border-ds-border bg-ds-cream text-ds-accent-ink">
                    <Camera className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ds-ink">Cliente avisado na hora certa</p>
                    <p className="mt-1 text-sm leading-relaxed text-ds-muted">
                      Na entrega, dispare e-mail ou WhatsApp direto do app — com o link do material e sem sair do fluxo.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id="planos"
          className="mx-auto max-w-[1200px] scroll-mt-28 bg-ds-cream px-4 py-20 sm:px-6 lg:scroll-mt-32 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2 className={cn(displayClassName, "text-balance text-3xl font-extrabold tracking-tight sm:text-4xl")}>
              Planos para o seu ritmo de entrega
            </h2>
            <p className="mx-auto mt-5 max-w-[70ch] text-pretty text-base leading-relaxed text-ds-muted sm:text-lg">
              O Free cobre o básico. No Pro entram equipe, e-mail automático na entrega e limites maiores.
            </p>

            <p className="mt-8 text-sm text-ds-muted-2">
              Mensal para flexibilidade. Anual para economizar {yearlySavingsPercent}%.
            </p>
          </div>

          <div className="mt-12 mx-auto grid max-w-6xl justify-items-stretch gap-6 md:justify-items-center lg:grid-cols-3 lg:gap-6">
            <div className="flex w-full max-w-[420px] flex-col rounded-[28px] border border-ds-border bg-ds-surface p-7 shadow-ds-card min-h-[640px]">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ds-muted-2">Free</p>
                <p className="mt-1 text-sm text-ds-muted">Para começar sem compromisso</p>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-ds-ink">R$ 0</span>
                <span className="pb-2 text-sm font-medium text-ds-muted-2">/ mês</span>
              </div>

              <Link
                href="/login"
                className="mt-7 inline-flex w-full items-center justify-center rounded-ds-2xl border-[1.5px] border-ds-border bg-ds-surface px-6 py-3 text-sm font-semibold text-ds-ink transition duration-ds ease-out hover:border-stone-300"
              >
                Começar
              </Link>

              <div className="mt-7 border-t border-ds-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted-2">Inclui</p>
                <ul className="mt-4 space-y-3 text-sm text-ds-muted">
                  {[
                    `Até ${FREE_MAX_ACTIVE_JOBS} jobs ativos no Kanban`,
                    `Até ${FREE_MAX_CONTACTS} contatos`,
                    "Kanban com até 4 etapas (Backup → Em Edição → Em Aprovação → Entregue)",
                    "Tarefas, Anotações e Agenda",
                    "Relatórios básicos",
                    "1 usuário por conta",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ds-border bg-ds-cream text-ds-ink"
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-ds-border bg-ds-ink p-7 text-ds-on-dark shadow-ds-card min-h-[640px]">
              <div className="pointer-events-none absolute -right-28 -top-28 h-60 w-60 rounded-full bg-ds-accent/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/75">Pro</p>
                  <p className="mt-1 text-sm text-white/70">Para estúdios em crescimento</p>
                </div>
                <span className="rounded-full bg-ds-accent px-3 py-1 text-[0.75rem] font-semibold text-white">
                  Recomendado
                </span>
              </div>

              <div className="relative mt-6">
                <p className="text-sm text-white/50">
                  de:{" "}
                  <span className="line-through">{formatBrl(proOriginalMonthly)}</span>{" "}
                  por
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-white">
                    {formatBrl(proMonthly)}
                  </span>
                  <span className="pb-2 text-sm font-medium text-white/70">/ mês</span>
                </div>
              </div>

              <Link
                href="/login"
                className="relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-6 py-3 text-sm font-semibold text-white transition duration-ds ease-out hover:brightness-110"
              >
                Assinar o Pro
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="relative mt-3 text-center text-xs text-white/60">
                Pagamento do Pro com cartão de crédito.
              </p>

              <div className="relative mt-7 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Tudo do Free, mais</p>
                <ul className="mt-4 space-y-3 text-sm text-white/75">
                  {[
                    "Jobs e contatos ilimitados",
                    "Etapas ilimitadas no kanban (reordenar, renomear e definir etapa final)",
                    "Equipe: convites por e-mail (multi-usuário)",
                    "E-mail automático ao enviar material para o cliente",
                    "Envio de material por WhatsApp direto do app",
                    "Modelos de e-mail de entrega personalizáveis",
                    "Histórico de alterações dos jobs",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex w-full max-w-[420px] flex-col justify-between rounded-[28px] border border-ds-border bg-ds-surface p-7 shadow-ds-card min-h-[640px] lg:max-w-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ds-muted-2">Pro Anual</p>
                  <p className="mt-1 text-sm text-ds-muted">Economize no plano anual</p>
                </div>
                {yearlySavingsPercent > 0 ? (
                  <span className="rounded-full bg-ds-cream px-3 py-1 text-[0.75rem] font-semibold text-ds-ink">
                    -{yearlySavingsPercent}%
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="text-sm text-ds-muted">
                  de:{" "}
                  <span className="line-through">{formatBrl(proOriginalYearly)}</span>{" "}
                  por
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-ds-ink">{formatBrl(proYearly)}</span>
                  <span className="pb-2 text-sm font-medium text-ds-muted-2">/ ano</span>
                </div>
              </div>

              <Link
                href="/login"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl border-[1.5px] border-ds-border bg-ds-surface px-6 py-3 text-sm font-semibold text-ds-ink transition duration-ds ease-out hover:border-stone-300"
              >
                Assinar anual
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-center text-xs text-ds-muted-2">
                {yearlySavingsPercent > 0
                  ? `Equivale a ${formatBrl(proYearly / 12)}/mês no anual.`
                  : "Pagamento anual."}
              </p>

              <div className="mt-7 border-t border-ds-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Tudo do Pro, mais economia
                </p>
                <ul className="mt-4 space-y-3 text-sm text-ds-muted">
                  {[
                    "Todos os recursos do plano Pro",
                    `Equivale a ${formatBrl(proYearly / 12)}/mês`,
                    `Economia de ${formatBrl(proMonthly * 12 - proYearly)} por ano`,
                    "Pagamento único anual",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ds-border bg-ds-cream text-ds-ink"
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-28 border-t border-ds-border bg-ds-cream py-16 lg:scroll-mt-32 lg:py-20"
        >
          <div className="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-8">
            <h2
              className={cn(
                displayClassName,
                "text-center text-2xl font-extrabold tracking-tight text-ds-ink sm:text-3xl",
              )}
            >
              Perguntas frequentes
            </h2>
            <div className="mt-8 space-y-2">
              {[
                {
                  q: "O Donyapp é gratuito?",
                  a: "Sim. Você pode começar no plano gratuito e mudar quando o estúdio crescer. Não pedimos cartão para testar.",
                },
                {
                  q: "Serve para vídeo e foto?",
                  a: "Sim. O fluxo em colunas funciona para qualquer tipo de job de pós-produção, com prazos e etapas do seu jeito.",
                },
                {
                  q: "Preciso instalar algo?",
                  a: "Não. Tudo roda no navegador; entre com sua conta Google e monte seu board em minutos.",
                },
                {
                  q: "Posso personalizar as colunas do kanban?",
                  a: "Sim. Em Configurações você renomeia, cria e reordena as etapas e define qual é a etapa final. No plano gratuito há até 4 colunas; no Pro, etapas ilimitadas.",
                },
                {
                  q: "Dá para trabalhar em equipe no mesmo estúdio?",
                  a: "Sim, no plano Pro: você convida por e-mail e todos enxergam os mesmos jobs, contatos e board. Os dados ficam na conta do estúdio, não presos a um único login.",
                },
                {
                  q: "O Donyapp guarda meus arquivos de foto e vídeo?",
                  a: "Não armazenamos seus arquivos. Você usa o serviço que já utiliza (Drive, Dropbox, WeTransfer etc.) e cola o link de entrega no job. No plano Pro, ao mover o job para a etapa final, você pode enviar um e-mail ao cliente com modelo editável. O envio é opcional e você confirma antes.",
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-ds-2xl border border-ds-border-strong bg-ds-surface px-4 py-1 transition open:shadow-ds-sm"
                >
                  <summary className="cursor-pointer list-none py-3 text-sm font-semibold text-ds-ink marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      {q}
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-ds-muted-2 transition group-open:rotate-90"
                        aria-hidden
                      />
                    </span>
                  </summary>
                  <p className="border-t border-ds-cream pb-3 pt-3 text-sm leading-relaxed text-ds-muted">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="border-t border-ds-border bg-ds-ink py-16 lg:py-20">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2
            className={cn(
              displayClassName,
              "text-2xl font-extrabold tracking-tight text-white sm:text-3xl",
            )}
          >
            Organize seu estúdio hoje
          </h2>
          <p className="text-sm text-white/60">
            Comece gratuitamente e sinta a diferença desde o primeiro job.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-ds-2xl bg-white px-7 py-3.5 text-sm font-semibold text-ds-ink shadow-ds-sm transition duration-ds ease-out hover:bg-ds-cream"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-white/40">Sem cartão. Sem compromisso.</p>
        </div>
      </section>

      <footer className="border-t border-ds-border bg-ds-cream py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-4 text-center text-xs text-ds-muted-2 sm:flex-row sm:justify-between sm:gap-4 sm:text-left sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Image
              src="/brand/logo-dony-png.png"
              alt="Donyapp"
              width={100}
              height={28}
              className="h-6 w-auto max-w-[8rem] object-contain opacity-90"
            />
            <a
              href="https://www.instagram.com/dony__app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ds-border-strong bg-ds-surface px-3.5 py-2 text-[0.8125rem] font-semibold text-ds-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] transition duration-ds ease-out hover:border-ds-accent/45 hover:bg-white hover:text-ds-accent-ink"
            >
              <svg
                className="h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>@dony__app</span>
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end sm:text-right">
            <p className="text-ds-muted">Donyapp, gestão de pós-produção para fotógrafos e videomakers.</p>
            <LegalLinks className="text-xs" linkClassName="text-ds-muted-2 hover:text-ds-ink" />
          </div>
        </div>
      </footer>
    </div>
  );
}
