"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getAccountContext(): Promise<
  { accountId: string; userId: string } | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: "Conta não encontrada para este usuário." };
  }

  return { accountId: profile.account_id, userId: user.id };
}

function parseTaskForm(formData: FormData):
  | { error: string }
  | { name: string; priority: TaskPriority; deadline: string; notes: string | null; status: TaskStatus }
{
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) return { error: "Nome da tarefa é obrigatório." };

  const priorityRaw = formData.get("priority") as string | null;
  if (!priorityRaw || !["baixa", "media", "alta"].includes(priorityRaw)) {
    return { error: "Selecione a prioridade." };
  }

  const deadlineRaw = (formData.get("deadline") as string | null)?.trim() ?? "";
  if (!deadlineRaw || !/^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw)) {
    return { error: "Prazo inválido." };
  }

  const statusRaw = formData.get("status") as string | null;
  const status: TaskStatus =
    statusRaw && ["para_fazer", "iniciado", "feito"].includes(statusRaw)
      ? (statusRaw as TaskStatus)
      : "para_fazer";

  const notes = (formData.get("notes") as string | null)?.trim() || null;

  return {
    name,
    priority: priorityRaw as TaskPriority,
    deadline: deadlineRaw,
    notes,
    status,
  };
}

async function nextPositionInStatus(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  status: TaskStatus,
  excludeId?: string
): Promise<number> {
  let q = supabase
    .from("tasks")
    .select("position")
    .eq("account_id", accountId)
    .eq("status", status);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.order("position", { ascending: false }).limit(1).maybeSingle();
  return (data?.position ?? -1) + 1;
}

export async function createTask(formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = parseTaskForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = createClient();
  const position = await nextPositionInStatus(supabase, ctx.accountId, parsed.status);

  const { error } = await supabase.from("tasks").insert({
    account_id: ctx.accountId,
    created_by: ctx.userId,
    name: parsed.name,
    priority: parsed.priority,
    deadline: parsed.deadline,
    notes: parsed.notes,
    status: parsed.status,
    position,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTask(taskId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = parseTaskForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Tarefa não encontrada." };

  const statusChanged = existing.status !== parsed.status;
  const position = statusChanged
    ? await nextPositionInStatus(supabase, ctx.accountId, parsed.status, taskId)
    : undefined;

  const { error } = await supabase
    .from("tasks")
    .update({
      name: parsed.name,
      priority: parsed.priority,
      deadline: parsed.deadline,
      notes: parsed.notes,
      status: parsed.status,
      ...(position !== undefined ? { position } : {}),
    })
    .eq("id", taskId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export type TaskKanbanSync = { status: TaskStatus; taskIdsOrdered: string[] };

export async function syncTasksKanban(moves: TaskKanbanSync[]): Promise<ActionResult> {
  try {
    const ctx = await getAccountContext();
    if ("error" in ctx) return { ok: false, error: ctx.error };

    const supabase = createClient();

    const allIds = moves.flatMap((m) => m.taskIdsOrdered);
    if (new Set(allIds).size !== allIds.length) {
      return { ok: false, error: "Lista de tarefas inválida (duplicado)." };
    }

    if (allIds.length > 0) {
      const { data: owned, error: ownErr } = await supabase
        .from("tasks")
        .select("id")
        .eq("account_id", ctx.accountId)
        .in("id", allIds);
      if (ownErr) return { ok: false, error: ownErr.message };
      if (!owned || owned.length !== allIds.length) {
        return { ok: false, error: "Uma ou mais tarefas são inválidas." };
      }
    }

    for (const { status, taskIdsOrdered } of moves) {
      for (let i = 0; i < taskIdsOrdered.length; i++) {
        const { error } = await supabase
          .from("tasks")
          .update({ status, position: i })
          .eq("id", taskIdsOrdered[i]!)
          .eq("account_id", ctx.accountId);
        if (error) return { ok: false, error: error.message };
      }
    }

    revalidatePath("/tasks");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao sincronizar tarefas.",
    };
  }
}
