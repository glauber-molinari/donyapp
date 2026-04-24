import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { TasksView } from "./tasks-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarefas",
};

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Tarefas</h1>
        <p className="mt-2 text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const plan = sub?.plan ?? "free";

  if (plan !== "pro") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ds-ink">Tarefas</h1>
            <p className="mt-1 text-sm text-ds-muted">
              Organize as atividades do seu estúdio
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
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-xl font-bold text-ds-ink">Planner de Tarefas PRO</h2>
              <p className="mb-6 max-w-md text-sm text-ds-muted">
                Organize tarefas em colunas Kanban ou lista, com prioridades, prazos e observações.
                <br />
                Perfeito para gerenciar atividades do estúdio além das edições.
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
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-app-border bg-white p-4">
                <h3 className="mb-3 font-semibold text-ds-ink">Para Fazer</h3>
                <div className="space-y-2">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-600"></span>
                      <span className="text-xs font-medium text-red-900">Alta</span>
                    </div>
                    <p className="text-sm font-medium text-ds-ink">Revisar contrato cliente</p>
                    <p className="mt-1 text-xs text-ds-muted">Prazo: Hoje</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                      <span className="text-xs font-medium text-gray-700">Baixa</span>
                    </div>
                    <p className="text-sm font-medium text-ds-ink">Atualizar redes sociais</p>
                    <p className="mt-1 text-xs text-ds-muted">Prazo: 2 dias</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-4">
                <h3 className="mb-3 font-semibold text-ds-ink">Iniciado</h3>
                <div className="space-y-2">
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-600"></span>
                      <span className="text-xs font-medium text-yellow-900">Média</span>
                    </div>
                    <p className="text-sm font-medium text-ds-ink">Organizar backup dos arquivos</p>
                    <p className="mt-1 text-xs text-ds-muted">Prazo: Amanhã</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-app-border bg-white p-4">
                <h3 className="mb-3 font-semibold text-ds-ink">Feito</h3>
                <div className="space-y-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 opacity-60">
                    <p className="text-sm font-medium text-ds-ink line-through">Responder emails</p>
                    <p className="mt-1 text-xs text-ds-muted">Concluído</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("account_id", profile.account_id)
    .order("status", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Tarefas</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar as tarefas. Tente novamente.
        </p>
      </div>
    );
  }

  return <TasksView tasks={(tasks ?? []) as TaskRow[]} />;
}
