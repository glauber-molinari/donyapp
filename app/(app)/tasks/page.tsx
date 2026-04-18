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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-cream text-ds-ink">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ds-ink">Tarefas</h1>
          <p className="max-w-sm text-sm text-ds-muted">
            O planner de tarefas é exclusivo do plano Pro. Organize as atividades do seu estúdio
            em colunas Kanban ou em lista, com prioridade, prazo e observações.
          </p>
        </div>
        <Link
          href="/settings/plan"
          className="rounded-ds-xl bg-ds-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          Ver plano Pro
        </Link>
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
