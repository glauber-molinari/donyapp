import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getAccountPlan } from "@/lib/subscriptions/require-pro";

import { FormulariosNav } from "./formularios-nav";

export default async function FormulariosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.account_id) {
      isPro = (await getAccountPlan(supabase, profile.account_id)) === "pro";
    }
  }

  if (!isPro) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ds-ink">Formulários</h1>
              <p className="mt-1 text-sm text-ds-muted">
                Colete briefings e respostas dos clientes sem sair do Dony
              </p>
            </div>
            <span className="rounded-full bg-ds-accent px-3 py-1.5 text-xs font-bold text-white">
              EXCLUSIVO PRO
            </span>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
              <div className="rounded-2xl border-2 border-ds-accent bg-white p-8 text-center shadow-xl">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ds-accent/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-ds-accent"
                    >
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect width="8" height="4" x="8" y="3" rx="1" />
                      <path d="M9 12h6" />
                      <path d="M9 16h6" />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-2 text-xl font-bold text-ds-ink">Formulários PRO</h2>
                <p className="mb-6 max-w-md text-sm text-ds-muted">
                  Crie modelos, compartilhe um link com o cliente e receba as respostas direto no
                  app.
                  <br />
                  Ideal para briefings, questionários e coleta de dados antes do job.
                </p>
                <Link
                  href="/settings/plan"
                  className="inline-flex items-center gap-2 rounded-ds-xl bg-ds-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Fazer upgrade para PRO
                </Link>
              </div>
            </div>

            <div className="pointer-events-none opacity-60 blur-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-ds-border bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                    Modelos
                  </p>
                  <p className="mt-3 text-base font-semibold text-ds-ink">Briefing de casamento</p>
                  <p className="mt-1 text-sm text-ds-muted">8 campos · link ativo</p>
                </div>
                <div className="rounded-lg border border-ds-border bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                    Recebidos
                  </p>
                  <p className="mt-3 text-base font-semibold text-ds-ink">3 respostas novas</p>
                  <p className="mt-1 text-sm text-ds-muted">Última há 2 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-b border-ds-border px-4 pb-0 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-2xl font-bold text-ds-ink">Formulários</h1>
          <FormulariosNav />
        </div>
      </div>
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
