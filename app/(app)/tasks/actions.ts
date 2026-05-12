"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";
import { buildTaskAssignmentHtml } from "@/lib/email/task-assignment-html";
import type {
  TaskPriority,
  TaskStatus,
  TaskType,
  TaskSubtask,
  Database,
} from "@/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getAccountContext(): Promise<
  { accountId: string; userId: string; userName: string; userAvatar: string | null } | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: "Conta não encontrada para este usuário." };
  }

  return {
    accountId: profile.account_id,
    userId: user.id,
    userName: profile.name ?? "Usuário",
    userAvatar: profile.avatar_url ?? null,
  };
}

function isSchemaError(err: { message?: string } | null): boolean {
  return !!err?.message?.includes("schema cache");
}

function parseTaskForm(formData: FormData):
  | { error: string }
  | {
      name: string;
      priority: TaskPriority;
      deadline: string;
      notes: string | null;
      type: TaskType;
      start_date: string | null;
      status: TaskStatus;
    }
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

  const typeRaw = formData.get("type") as string | null;
  const type: TaskType =
    typeRaw && ["tarefa", "sessao", "edicao", "revisao", "entrega"].includes(typeRaw)
      ? (typeRaw as TaskType)
      : "tarefa";

  const startDateRaw = (formData.get("start_date") as string | null)?.trim() ?? "";
  const start_date =
    startDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(startDateRaw) ? startDateRaw : null;

  const notes = (formData.get("notes") as string | null)?.trim() || null;

  return { name, priority: priorityRaw as TaskPriority, deadline: deadlineRaw, notes, type, start_date, status };
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

export async function createTask(formData: FormData): Promise<ActionResult & { taskId?: string }> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = parseTaskForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = createClient();
  const position = await nextPositionInStatus(supabase, ctx.accountId, parsed.status);

  const baseInsert = {
    account_id: ctx.accountId,
    created_by: ctx.userId,
    name: parsed.name,
    priority: parsed.priority,
    deadline: parsed.deadline,
    notes: parsed.notes,
    status: parsed.status,
    position,
  };

  // Try with new columns; fall back to base columns if migration not yet applied
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...baseInsert, type: parsed.type, start_date: parsed.start_date })
    .select("id")
    .single();

  if (error && isSchemaError(error)) {
    const { data: fallback, error: fe } = await supabase
      .from("tasks")
      .insert(baseInsert)
      .select("id")
      .single();
    if (fe) return { ok: false, error: fe.message };
    revalidatePath("/tasks");
    return { ok: true, taskId: fallback.id };
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true, taskId: data.id };
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

  const baseUpdate = {
    name: parsed.name,
    priority: parsed.priority,
    deadline: parsed.deadline,
    notes: parsed.notes,
    status: parsed.status,
    ...(position !== undefined ? { position } : {}),
  };

  // Try with new columns; fall back to base columns if migration not yet applied
  const { error } = await supabase
    .from("tasks")
    .update({ ...baseUpdate, type: parsed.type, start_date: parsed.start_date })
    .eq("id", taskId)
    .eq("account_id", ctx.accountId);

  if (error && isSchemaError(error)) {
    const { error: fe } = await supabase
      .from("tasks")
      .update(baseUpdate)
      .eq("id", taskId)
      .eq("account_id", ctx.accountId);
    if (fe) return { ok: false, error: fe.message };
    revalidatePath("/tasks");
    return { ok: true };
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const position = await nextPositionInStatus(supabase, ctx.accountId, status, taskId);

  const { error } = await supabase
    .from("tasks")
    .update({ status, position })
    .eq("id", taskId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTaskSubtasks(
  taskId: string,
  subtasks: TaskSubtask[]
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ subtasks })
    .eq("id", taskId)
    .eq("account_id", ctx.accountId);

  // Silently ignore if column doesn't exist yet (migration pending)
  if (error && !isSchemaError(error)) return { ok: false, error: error.message };

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

// ─── Assignees ────────────────────────────────────────────────────────────────

type TaskAssigneeRow = Database["public"]["Tables"]["task_assignees"]["Row"];
type TaskCommentRow = Database["public"]["Tables"]["task_comments"]["Row"];

export async function getTaskDetails(taskId: string): Promise<
  | { ok: true; assignees: TaskAssigneeRow[]; comments: TaskCommentRow[] }
  | { ok: false; error: string }
> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  const [{ data: assignees, error: ae }, { data: comments, error: ce }] = await Promise.all([
    supabase
      .from("task_assignees")
      .select("*")
      .eq("task_id", taskId)
      .eq("account_id", ctx.accountId)
      .order("invited_at", { ascending: true }),
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .eq("account_id", ctx.accountId)
      .order("created_at", { ascending: true }),
  ]);

  if (ae) return { ok: false, error: ae.message };
  if (ce) return { ok: false, error: ce.message };

  return { ok: true, assignees: assignees ?? [], comments: comments ?? [] };
}

export async function addTaskAssignee(
  taskId: string,
  name: string,
  email: string,
  avatarUrl?: string | null
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName) return { ok: false, error: "Nome é obrigatório." };
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: "E-mail inválido." };
  }

  const supabase = createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("name, description, deadline")
    .eq("id", taskId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, avatar_url")
    .eq("email", trimmedEmail)
    .maybeSingle();

  // Prefer passed-in avatarUrl (from dropdown, which already resolved manual_job_assignees),
  // then fall back to the users table avatar.
  const resolvedAvatar = avatarUrl ?? existingUser?.avatar_url ?? null;

  const { error: insertErr } = await supabase.from("task_assignees").insert({
    task_id: taskId,
    account_id: ctx.accountId,
    name: trimmedName,
    email: trimmedEmail,
    user_id: existingUser?.id ?? null,
    avatar_url: resolvedAvatar,
  });

  if (insertErr) {
    if (insertErr.code === "23505") return { ok: false, error: "Esta pessoa já foi adicionada." };
    return { ok: false, error: insertErr.message };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dony.com.br";

  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const [d, m, y] = task.deadline.split("-").reverse();
      const deadlineFormatted = `${d}/${m}/${y}`;

      const taskText = `${ctx.userName} adicionou você à tarefa: ${task.name}\n\n${task.description ? task.description + "\n\n" : ""}Prazo: ${deadlineFormatted}\n\nVer tarefa no Dony:\n${appUrl}/tasks`;
      await resend.emails.send({
        from,
        to: [trimmedEmail],
        subject: `Você foi adicionado à tarefa: ${task.name}`,
        html: buildTaskAssignmentHtml({
          taskName: task.name,
          description: task.description,
          inviterName: ctx.userName,
          deadline: deadlineFormatted,
          appUrl: `${appUrl}/tasks`,
        }),
        text: taskText,
      });
    } catch {
      // swallow email error — assignee already added
    }
  }

  revalidatePath("/tasks");
  return { ok: true };
}

export async function removeTaskAssignee(
  assigneeId: string,
  taskId: string
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("task_assignees")
    .delete()
    .eq("id", assigneeId)
    .eq("task_id", taskId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

// ─── Available people (account members + manual assignees) ───────────────────

export type AvailablePerson = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export async function getAvailableAssignees(): Promise<
  { ok: true; people: AvailablePerson[] } | { ok: false; error: string }
> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  const [{ data: members }, { data: manuals }] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("account_id", ctx.accountId),
    supabase
      .from("manual_job_assignees")
      .select("id, name, email, photo_url")
      .eq("account_id", ctx.accountId)
      .order("position", { ascending: true }),
  ]);

  const map = new Map<string, AvailablePerson>();

  for (const m of members ?? []) {
    if (m.email && m.name) {
      map.set(m.email.toLowerCase(), {
        id: m.id,
        name: m.name,
        email: m.email,
        avatar_url: m.avatar_url ?? null,
      });
    }
  }

  for (const a of manuals ?? []) {
    const key = a.email.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: a.id,
        name: a.name,
        email: a.email,
        avatar_url: a.photo_url ?? null,
      });
    }
  }

  return { ok: true, people: Array.from(map.values()) };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addTaskComment(
  taskId: string,
  content: string
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comentário vazio." };

  const supabase = createClient();

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    account_id: ctx.accountId,
    user_id: ctx.userId,
    user_name: ctx.userName,
    user_avatar: ctx.userAvatar,
    content: trimmed,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}
