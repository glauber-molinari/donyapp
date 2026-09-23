import { ArrowRight, BarChart2, Calendar, Camera, ChevronRight, ClipboardList, Columns3, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { BlogLandingSection } from "@/components/marketing/blog-landing-section";
import { LegalLinks } from "@/components/legal/legal-links";
import {
  LandingPricingSection,
  SHOW_LANDING_PRICING,
} from "@/components/marketing/landing-pricing-section";
import { MarketingSiteHeader, marketingLandingNavItems } from "@/components/marketing/marketing-site-header";

function ProductPreviewMock() {
  return (
    <div
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-t-lg border border-ds-border bg-ds-surface shadow-ds-card sm:rounded-t-ds-card"
      aria-hidden
    >
      <div className="relative h-[min(260px,38vh)] w-full sm:h-[min(400px,55vh)]">
        <Image
          src="/marketing/img-dony.png"
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

export function LandingPage({ displayClassName, bodyClassName }: LandingPageProps) {
  return (
    <div className={cn(bodyClassName, "min-h-screen bg-ds-cream text-ds-ink antialiased")}>
      <MarketingSiteHeader navItems={marketingLandingNavItems} />

      <main>
        <section className="bg-ds-cream px-4 pb-0 pt-[6.75rem] sm:pt-32 lg:pt-[11.25rem]">
          <div className="mx-auto max-w-[1200px] text-center">
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

            <p className="mx-auto mt-8 max-w-[58ch] text-pretty text-center text-lg leading-relaxed text-ds-muted sm:text-xl">
              <span className="font-medium text-ds-ink">
                O Dony é um app web de gestão de pós-produção para fotógrafos, videomakers e estúdios.
              </span>{" "}
              Cadastre jobs, acompanhe o kanban, guarde clientes, receba formulários, veja a agenda da equipe e
              entregue com o prazo à vista, sem planilha solta nem ferramenta genérica.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 hover:shadow-md sm:w-auto"
              >
                Criar conta
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/por-que-usar"
                className="inline-flex w-full items-center justify-center text-sm font-semibold text-ds-ink underline decoration-ds-border underline-offset-[0.35em] transition duration-ds ease-out hover:decoration-ds-ink sm:w-auto sm:justify-center sm:px-2 sm:py-3.5"
              >
                Por que usar?
              </Link>
            </div>
            <p className="mt-5 text-sm text-ds-muted-2">
              Os 20 primeiros convidados ganham o Pro vitalício. Sem cartão.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-[1200px] sm:mt-20">
            <div className="relative -mb-px overflow-hidden px-0 sm:px-4 lg:px-8">
              {/* Degradê fade de baixo: mobile com fade mais alto e suave, desktop mantém padrão */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[min(65%,13rem)] bg-gradient-to-t from-ds-cream via-ds-cream/60 to-transparent from-[25%] via-[55%] sm:h-32 sm:from-10% sm:via-transparent" />
              <ProductPreviewMock />
            </div>
          </div>
        </section>

        <section className="border-t border-ds-border bg-ds-cream py-16 lg:py-20">
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
                  text: "Cole o link do Drive, Dropbox ou WeTransfer e dispare por e-mail automático ou WhatsApp Web direto do app.",
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
              Tudo que o estúdio precisa no mesmo lugar
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-center text-lg text-ds-muted">
              Feito para estúdios e freelancers de foto e vídeo que vivem de prazo, revisão e cliente no WhatsApp.
            </p>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Columns3,
                  title: "Kanban de edição",
                  text: "Colunas que acompanham o fluxo real: backup, edição, revisão e entrega. Arraste os cards e veja o estado de cada job em tempo real.",
                  pro: false,
                },
                {
                  icon: UsersRound,
                  title: "Contatos centralizados",
                  text: "Clientes vinculados aos jobs, com busca rápida e histórico organizado de todas as entregas.",
                  pro: false,
                },
                {
                  icon: ClipboardList,
                  title: "Formulários para clientes",
                  text: "Crie modelos de formulário e receba respostas dos clientes diretamente no app, sem ferramentas externas.",
                  pro: true,
                },
                {
                  icon: Calendar,
                  title: "Agenda integrada",
                  text: "O admin pode conectar o Google Calendar, se quiser. A equipe vê os compromissos junto dos jobs. Só leitura: a gente não cria nem mexe em eventos.",
                  pro: false,
                },
                {
                  icon: BarChart2,
                  title: "Relatórios e tarefas",
                  text: "Métricas de desempenho de entregas, prazos cumpridos e kanban de tarefas da equipe para nada se perder.",
                  pro: true,
                },
                {
                  icon: Camera,
                  title: "Feito para criativos",
                  text: "Visual calmo, tons pastéis e foco no que importa: entregar com qualidade e no prazo.",
                  pro: false,
                },
              ].map(({ icon: Icon, title, text, pro }) => (
                <li
                  key={title}
                  className="relative rounded-ds-card border border-ds-border-strong bg-ds-surface p-6 shadow-ds-sm transition duration-ds ease-out hover:shadow-ds-sm"
                >
                  {pro && (
                    <span className="absolute right-4 top-4 rounded-full bg-ds-accent/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-ds-accent">
                      Pro
                    </span>
                  )}
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
                  O Dony.app resolve cada um deles.
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
                      Na entrega, dispare e-mail ou WhatsApp Web direto do app, com o link do material e sem sair do fluxo.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {SHOW_LANDING_PRICING ? <LandingPricingSection displayClassName={displayClassName} /> : null}

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
                  q: "O Dony.app é gratuito?",
                  a: "Dá para usar o Free sem cartão. Os 20 primeiros convidados recebem o Pro vitalício: a conta é criada normalmente e o acesso sai sem data para acabar.",
                },
                {
                  q: "Como funciona o Pro vitalício?",
                  a: "Se você foi convidado e está entre os 20, crie a conta. O Pro é liberado na conta, sem cobrança e sem renovação. Tarefas, relatórios, equipe, e-mail, WhatsApp e o board de álbum entram juntos.",
                },
                {
                  q: "Serve para vídeo e foto?",
                  a: "Sim. O fluxo em colunas funciona para qualquer tipo de job de pós-produção, com prazos e etapas do seu jeito.",
                },
                {
                  q: "Preciso instalar algo?",
                  a: "Não. Tudo roda no navegador. Você entra com Google ou e-mail e senha. No Google, usamos nome, e-mail e foto para criar a conta e mostrar seu perfil à equipe.",
                },
                {
                  q: "A agenda usa o Google Calendar?",
                  a: (
                    <>
                      Sim, se um administrador conectar. É opcional. Mostramos os compromissos no app e paramos por aí:
                      não criamos, alteramos nem apagamos eventos. O detalhe está na{" "}
                      <Link
                        href="/politica-de-privacidade"
                        className="font-medium text-ds-ink underline decoration-ds-border underline-offset-4 hover:decoration-ds-ink"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </>
                  ),
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
                  q: "O Dony.app guarda meus arquivos de foto e vídeo?",
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
            Crie a conta. Os 20 primeiros convidados ficam no Pro vitalício.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-ds-2xl bg-white px-7 py-3.5 text-sm font-semibold text-ds-ink shadow-ds-sm transition duration-ds ease-out hover:bg-ds-cream"
          >
            Criar conta
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-white/40">Sem cartão.</p>
        </div>
      </section>

      <BlogLandingSection />

      <footer className="border-t border-ds-border bg-ds-cream py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-4 text-center text-xs text-ds-muted-2 sm:flex-row sm:justify-between sm:gap-4 sm:text-left sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Image
              src="/brand/logo-dony-png.png"
              alt="Dony.app"
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
            <p className="text-ds-muted">Dony.app, gestão de pós-produção para fotógrafos e videomakers.</p>
            <LegalLinks className="text-xs" linkClassName="text-ds-muted-2 hover:text-ds-ink" />
          </div>
        </div>
      </footer>
    </div>
  );
}
