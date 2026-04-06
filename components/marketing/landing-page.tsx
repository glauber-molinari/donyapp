import { ArrowRight, Camera, ChevronRight, Columns3, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { LegalLinks } from "@/components/legal/legal-links";

const heroNavItems = [
  { href: "#sobre", label: "Sobre" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
] as const;

function HeroFloatingNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Seções da página"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-ds-border bg-white/95 px-1 py-1 shadow-ds-md backdrop-blur-md",
        className,
      )}
    >
      {heroNavItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-ds-ink transition duration-ds ease-out hover:bg-ds-cream sm:px-4"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ProductPreviewMock() {
  return (
    <div
      className="mx-auto w-full max-w-5xl rounded-t-ds-card border border-ds-border bg-ds-surface shadow-ds-card"
      aria-hidden
    >
      <div className="flex min-h-[320px] sm:min-h-[380px]">
        <aside className="hidden w-44 shrink-0 border-r border-ds-border-strong bg-ds-elevated p-3 sm:block">
          <div className="mb-4 flex justify-center">
            <Image
              src="/brand/logo-dony-png.png"
              alt=""
              width={88}
              height={24}
              className="h-5 w-auto max-w-[5.5rem] object-contain opacity-90"
            />
          </div>
          <div className="space-y-2">
            {["Board", "Contatos", "Config"].map((label, i) => (
              <div
                key={label}
                className={cn(
                  "rounded-ds-xl px-2 py-2 text-xs font-medium",
                  i === 0 ? "bg-ds-ink text-white" : "text-ds-muted",
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="h-7 w-40 rounded-ds-xl bg-ds-cream" />
            <div className="h-8 w-28 rounded-ds-2xl border border-ds-border bg-ds-surface" />
          </div>
          <div className="flex gap-3 pb-2">
            {[
              { title: "Backup", cards: [{ t: "Casamento A", tags: ["accent"] }] },
              {
                title: "Em Edição",
                cards: [
                  { t: "Ensaio B", tags: ["ring"] },
                  { t: "Vídeo C", tags: [] },
                ],
              },
              { title: "Em Aprovação", cards: [{ t: "Corporativo", tags: [] }] },
              { title: "Entregue", cards: [{ t: "Evento X", tags: ["muted"] }] },
            ].map((col) => (
              <div
                key={col.title}
                className="w-[140px] shrink-0 rounded-ds-2xl border border-ds-border-strong bg-ds-cream p-2 sm:w-[160px]"
              >
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-ds-subtle">
                  {col.title}
                </p>
                <div className="space-y-2">
                  {col.cards.map((c) => (
                    <div
                      key={c.t}
                      className={cn(
                        "rounded-ds-xl border bg-ds-surface p-2 text-xs font-medium text-ds-ink",
                        c.tags.includes("ring")
                          ? "border-ds-accent ring-1 ring-ds-accent/25"
                          : "border-ds-border-strong",
                      )}
                    >
                      <p className="truncate">{c.t}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.tags.includes("muted") && (
                          <span className="rounded-full bg-ds-border px-2 py-0.5 text-[9px] font-semibold text-ds-muted">
                            Entregue
                          </span>
                        )}
                        {c.tags.includes("accent") && (
                          <span className="rounded-full bg-ds-accent px-2 py-0.5 text-[9px] font-semibold text-white">
                            Novo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
      <header className="fixed top-0 z-50 w-full bg-ds-cream/70 transition-colors supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 pb-3 pt-3 sm:px-6 lg:px-8">
          <div className="relative flex min-h-[3rem] flex-col gap-3 lg:block lg:min-h-[3.25rem]">
            <div className="flex items-center justify-between gap-3 lg:contents">
              <div className="flex shrink-0 items-center lg:absolute lg:left-0 lg:top-1/2 lg:z-[1] lg:-translate-y-1/2">
                <Link
                  href="/"
                  className="flex items-center justify-center font-semibold tracking-tight text-ds-ink"
                >
                  <Image
                    src="/brand/logo-dony-png.png"
                    alt="Donyapp"
                    width={120}
                    height={32}
                    className="h-7 w-auto max-w-[9.5rem] object-contain sm:h-8 sm:max-w-[10.5rem]"
                    priority
                  />
                </Link>
              </div>

              <div className="hidden justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2">
                <HeroFloatingNav />
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2">
                <Link
                  href="/login"
                  className="text-[0.9rem] font-medium text-ds-ink transition duration-ds ease-out hover:opacity-80"
                >
                  Entrar
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-ds-accent px-4 py-2 text-[0.85rem] font-semibold text-white transition duration-ds ease-out hover:brightness-95 sm:px-5 sm:text-[0.9rem]"
                >
                  Começar grátis
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:hidden">
              <HeroFloatingNav />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-ds-cream px-4 pb-0 pt-[9.5rem] sm:pt-[10rem] lg:pt-[11.25rem]">
          <div className="mx-auto max-w-[1200px] text-center">
            <Link
              href="/login"
              className="group mb-8 inline-flex items-center gap-2 rounded-full bg-ds-ink px-1 py-1 pl-1.5 pr-3 text-[0.75rem] font-semibold text-white transition duration-ds ease-out hover:brightness-110 sm:mb-10"
            >
              <span className="rounded-full bg-ds-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Novo
              </span>
              <span className="pr-0.5">Pós-produção, sem caos</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-80 transition group-hover:translate-x-0.5" />
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
              <span className="text-ds-accent">do briefing ao entregue</span>.
            </h1>

            <p className="mx-auto mt-8 max-w-[55ch] text-pretty text-center text-lg leading-relaxed text-ds-muted sm:text-xl">
              Um kanban feito para fotógrafos e videomakers: prazos claros, clientes organizados e a equipe
              alinhada, sem planilhas nem ferramentas genéricas.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 hover:shadow-md sm:w-auto"
              >
                Entrar com Google
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-ds-2xl border-[1.5px] border-ds-border bg-ds-surface px-7 py-3.5 text-sm font-semibold text-ds-ink transition duration-ds ease-out hover:border-stone-300 sm:w-auto"
              >
                Entrar
              </Link>
            </div>
            <p className="mt-5 text-sm text-ds-subtle">Plano gratuito para começar. Sem cartão.</p>
          </div>

          <div className="relative mx-auto mt-14 max-w-[1200px] sm:mt-20">
            <div className="relative -mb-px overflow-hidden px-0 sm:px-4 lg:px-8">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-ds-cream from-10% to-transparent sm:h-32" />
              <ProductPreviewMock />
            </div>
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
              Tudo que o seu estúdio precisa em um só lugar
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
                  text: "Clientes vinculados aos jobs — busca rápida e histórico organizado.",
                },
                {
                  icon: Camera,
                  title: "Feito para creators",
                  text: "Visual calmo, pastéis e foco no que importa: entregar no tempo.",
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
          id="planos"
          className="mx-auto max-w-[1200px] scroll-mt-28 bg-ds-cream px-4 py-20 sm:px-6 lg:scroll-mt-32 lg:px-8 lg:py-24"
        >
          <div className="rounded-ds-card border border-ds-border bg-ds-ink px-8 py-14 text-center text-ds-on-dark sm:px-12">
            <h2 className={cn(displayClassName, "text-balance text-2xl font-extrabold sm:text-3xl")}>
              Pronto para organizar sua pós?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Crie sua conta em segundos com o Google e monte seu primeiro board.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-ds-2xl bg-ds-accent px-7 py-3.5 text-sm font-semibold text-white transition duration-ds ease-out hover:brightness-110"
            >
              Acessar o app
              <ArrowRight className="h-4 w-4" />
            </Link>
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
                  a: "Sim. Você pode começar no plano gratuito e evoluir quando o estúdio crescer — sem cartão para testar.",
                },
                {
                  q: "Serve para vídeo e foto?",
                  a: "Sim. O fluxo em colunas funciona para qualquer tipo de job de pós-produção, com prazos e etapas do seu jeito.",
                },
                {
                  q: "Preciso instalar algo?",
                  a: "Não. Tudo roda no navegador; entre com sua conta Google e monte seu board em minutos.",
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
                        className="h-4 w-4 shrink-0 text-ds-subtle transition group-open:rotate-90"
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

      <footer className="border-t border-ds-border bg-ds-cream py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 text-center text-xs text-ds-subtle sm:flex-row sm:justify-between sm:text-left sm:px-6 lg:px-8">
          <div className="flex items-center justify-center sm:justify-start">
            <Image
              src="/brand/logo-dony-png.png"
              alt="Donyapp"
              width={100}
              height={28}
              className="h-6 w-auto max-w-[8rem] object-contain opacity-90"
            />
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-end sm:text-right">
            <p className="text-ds-muted">Donyapp — gestão de pós-produção para fotógrafos e videomakers.</p>
            <LegalLinks className="text-xs" linkClassName="text-ds-subtle hover:text-ds-ink" />
          </div>
        </div>
      </footer>
    </div>
  );
}
