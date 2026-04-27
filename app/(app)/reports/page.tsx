import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

import { ReportsView } from "./reports-view";

export const metadata: Metadata = {
  title: "Relatórios | Donyapp",
};

function ReportsLoadingFallback() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
      <p className="text-sm text-ds-muted">Carregando métricas...</p>
    </div>
  );
}

export default async function ReportsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
        <p className="mt-2 text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (subscription?.plan !== "pro") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
            <p className="mt-1 text-sm text-ds-muted">
              Análise detalhada do desempenho das suas entregas
            </p>
          </div>
          <span className="rounded-full bg-ds-accent px-3 py-1.5 text-xs font-bold text-white">
            EXCLUSIVO PRO
          </span>
        </div>

        <div className="relative">
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
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-ds-ink">Relatórios Detalhados PRO</h2>
              <p className="mb-6 max-w-md text-sm text-ds-muted">
                Acompanhe métricas completas: média de entrega, desempenho por tipo de job, entregas no prazo, alterações e muito mais.
                <br />
                Tome decisões baseadas em dados reais do seu estúdio.
              </p>
              <a
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
              </a>
            </div>
          </div>

          <div className="pointer-events-none opacity-60 blur-sm">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ds-muted">Média de Entrega</span>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ds-ink">8 dias</p>
                <p className="mt-1 text-xs text-ds-muted">Tempo médio de conclusão</p>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ds-muted">Total Entregue</span>
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="M22 4 12 14.01l-3-3" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ds-ink">156</p>
                <p className="mt-1 text-xs text-ds-muted">Jobs finalizados</p>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ds-muted">Jobs Ativos</span>
                  <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ds-ink">23</p>
                <p className="mt-1 text-xs text-ds-muted">Em andamento</p>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ds-muted">Taxa no Prazo</span>
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-5 w-5"
                    >
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ds-ink">87%</p>
                <p className="mt-1 text-xs text-ds-muted">Entregas pontuais</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-ds-ink">Média por Tipo</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-ds-ink">Foto</span>
                    <span className="text-lg font-bold text-ds-accent">5 dias</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-ds-ink">Vídeo</span>
                    <span className="text-lg font-bold text-ds-accent">12 dias</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-ds-ink">Foto + Vídeo</span>
                    <span className="text-lg font-bold text-ds-accent">15 dias</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-ds-ink">Entregas no Prazo</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ds-ink">No prazo</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">87%</p>
                      <p className="text-xs text-ds-muted">136 jobs</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ds-ink">Atrasado</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">13%</p>
                      <p className="text-xs text-ds-muted">20 jobs</p>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[87%] bg-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ReportsLoadingFallback />}>
      <ReportsView />
    </Suspense>
  );
}
