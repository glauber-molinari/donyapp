import { ArrowRight, Camera, Columns3, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LandingPageProps {
  displayClassName: string;
  bodyClassName: string;
}

export function LandingPage({ displayClassName, bodyClassName }: LandingPageProps) {
  return (
    <div
      className={`${bodyClassName} text-gray-800 antialiased`}
      style={{
        background: "linear-gradient(165deg, #f2f7f5 0%, #eef3f1 35%, #ebe8f4 100%)",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/60 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <Image
              src="/brand/logo-wordmark.png"
              alt="dony"
              width={88}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-violet-700"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="landing-stagger">
              <p className="landing-reveal mb-4 inline-flex items-center rounded-full border border-violet-200/80 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-700/90">
                Pós-produção, sem caos
              </p>
              <h1
                className={`${displayClassName} landing-reveal text-4xl font-semibold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]`}
              >
                Seu fluxo de edição,{" "}
                <span className="text-violet-600/95">do briefing ao entregue</span>.
              </h1>
              <p className="landing-reveal mt-6 max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl">
                Um kanban feito para fotógrafos e videomakers: prazos claros, clientes
                organizados e a equipe alinhada — sem planilhas nem ferramentas
                genéricas.
              </p>
              <div className="landing-reveal mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
                >
                  Entrar com Google
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <p className="text-sm text-gray-500">
                  Plano gratuito para começar. Sem cartão.
                </p>
              </div>
            </div>

            <div className="landing-hero-visual relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-200/50 via-white/20 to-amber-100/40 blur-2xl" />
                <div className="relative flex aspect-square max-w-[min(100%,380px)] flex-col items-center justify-center rounded-[2rem] border border-white/80 bg-white/75 p-10 shadow-sm backdrop-blur-sm">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-violet-100 to-white shadow-inner ring-1 ring-violet-100/80">
                    <Image
                      src="/brand/logo-mark.png"
                      alt=""
                      width={72}
                      height={72}
                      className="h-[4.5rem] w-[4.5rem] object-contain"
                    />
                  </div>
                  <Image
                    src="/brand/logo-wordmark.png"
                    alt="dony"
                    width={140}
                    height={44}
                    className="h-10 w-auto opacity-90"
                  />
                  <p className="mt-6 text-center text-sm leading-relaxed text-gray-500">
                    Menos ruído. Mais entregas no prazo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/50 bg-white/35 py-20 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2
              className={`${displayClassName} mx-auto max-w-2xl text-center text-3xl font-semibold text-gray-900 sm:text-4xl`}
            >
              Tudo que o seu estúdio precisa em um só lugar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
              Pensado para quem vive de prazo, revisão e cliente no WhatsApp.
            </p>
            <ul className="mt-14 grid gap-6 sm:grid-cols-3">
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
                  className="rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-sm transition hover:border-violet-200/60 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-500/90 via-violet-500 to-violet-600 px-8 py-14 text-center shadow-lg sm:px-12">
            <h2
              className={`${displayClassName} text-2xl font-semibold text-white sm:text-3xl`}
            >
              Pronto para organizar sua pós?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-violet-100 sm:text-base">
              Crie sua conta em segundos com o Google e monte seu primeiro board.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-violet-700 shadow-md transition hover:bg-violet-50"
            >
              Acessar o app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/50 bg-white/30 py-8 text-center text-xs text-gray-500 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/logo-wordmark.png"
              alt="dony"
              width={64}
              height={20}
              className="h-5 w-auto opacity-70"
            />
          </div>
          <p>Donyapp — gestão de pós-produção para fotógrafos e videomakers.</p>
        </div>
      </footer>
    </div>
  );
}
