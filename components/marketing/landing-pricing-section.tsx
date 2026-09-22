import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { FREE_MAX_ACTIVE_JOBS, FREE_MAX_CONTACTS } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

/**
 * Cards de plano da landing. Fora da página até o lançamento com preços.
 * Para voltar: `SHOW_LANDING_PRICING = true` e o item "Planos" no header.
 */
export const SHOW_LANDING_PRICING = false;

export function LandingPricingSection({ displayClassName }: { displayClassName: string }) {
  return (
    <section
      id="planos"
      className="mx-auto max-w-[1200px] scroll-mt-28 bg-ds-cream px-4 py-20 sm:px-6 lg:scroll-mt-32 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className={cn(displayClassName, "text-balance text-3xl font-extrabold tracking-tight sm:text-4xl")}>
          Os 20 primeiros levam o Pro vitalício
        </h2>
        <p className="mx-auto mt-5 max-w-[70ch] text-pretty text-base leading-relaxed text-ds-muted sm:text-lg">
          Você cria a conta. Se estiver entre os 20 convidados, o Pro fica vitalício. Sem cartão e sem mensalidade.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl justify-items-stretch gap-6 md:grid-cols-2 md:justify-items-center">
        <div className="flex w-full max-w-[420px] flex-col rounded-[28px] border border-ds-border bg-ds-surface p-7 shadow-ds-card md:max-w-none">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ds-muted-2">Free</p>
            <p className="mt-1 text-sm text-ds-muted">Para começar sem compromisso</p>
          </div>

          <p className="mt-6 text-5xl font-black tracking-tight text-ds-ink">Sem cartão</p>

          <Link
            href="/signup"
            className="mt-7 inline-flex w-full items-center justify-center rounded-ds-2xl border-[1.5px] border-ds-border bg-ds-surface px-6 py-3 text-sm font-semibold text-ds-ink transition duration-ds ease-out hover:border-stone-300"
          >
            Criar conta
          </Link>

          <div className="mt-7 border-t border-ds-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted-2">Inclui</p>
            <ul className="mt-4 space-y-3 text-sm text-ds-muted">
              {[
                `Até ${FREE_MAX_ACTIVE_JOBS} jobs ativos no Kanban`,
                `Até ${FREE_MAX_CONTACTS} contatos`,
                "Kanban com até 4 etapas (Backup → Em Edição → Em Aprovação → Entregue)",
                "Anotações e Agenda (Google Calendar)",
                "Formulários para clientes",
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

        <div className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-ds-border bg-ds-ink p-7 text-ds-on-dark shadow-ds-card md:max-w-none">
          <div className="pointer-events-none absolute -right-28 -top-28 h-60 w-60 rounded-full bg-ds-accent/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/75">Pro vitalício</p>
              <p className="mt-1 text-sm text-white/70">Para os 20 primeiros convidados</p>
            </div>
            <span className="rounded-full bg-ds-accent px-3 py-1 text-[0.75rem] font-semibold text-white">
              20 vagas
            </span>
          </div>

          <p className="relative mt-6 text-5xl font-black tracking-tight text-white">Sem prazo</p>

          <Link
            href="/signup"
            className="relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-ds-2xl bg-ds-accent px-6 py-3 text-sm font-semibold text-white transition duration-ds ease-out hover:brightness-110"
          >
            Criar conta
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="relative mt-3 text-center text-xs text-white/60">
            Depois do cadastro, o Pro é liberado na conta. Não tem cobrança.
          </p>

          <div className="relative mt-7 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Tudo do Free, mais</p>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {[
                "Jobs e contatos ilimitados",
                "Etapas ilimitadas no kanban (reordenar, renomear e definir etapa final)",
                "Equipe: convites por e-mail (multi-usuário)",
                "E-mail automático ao enviar material para o cliente",
                "Envio de material por WhatsApp Web direto do app",
                "Modelos de e-mail de entrega personalizáveis",
                "Histórico de alterações dos jobs",
                "Tarefas: kanban de atividades da equipe",
                "Relatórios avançados de desempenho e entregas",
                "Board de álbum (workflow de entrega física)",
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
      </div>
    </section>
  );
}
