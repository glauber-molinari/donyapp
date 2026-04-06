"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Plano Free: no máximo 4 etapas (igual ao kanban padrão no provisionamento). Pro: ilimitado. */
const FREE_MAX_STAGES = 4;

/** Mesma rotação visual do provisionamento inicial */
const STAGE_COLORS: string[] = [
  "bg-ds-accent/10",
  "bg-amber-50",
  "bg-blue-50",
  "bg-green-50",
  "bg-pink-50",
];

type AdminContext =
  | { error: string }
  | { accountId: string; userId: string; isAdmin: boolean };

async function getAdminContext(): Promise<AdminContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: "Conta não encontrada para este usuário." };
  }

  return {
    accountId: profile.account_id,
    userId: user.id,
    isAdmin: profile.role === "admin",
  };
}

function requireAdmin(ctx: AdminContext): { accountId: string; userId: string } | { error: string } {
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  if (!ctx.isAdmin) {
    return { error: "Apenas administradores podem alterar o kanban." };
  }
  return { accountId: ctx.accountId, userId: ctx.userId };
}

async function getSubscriptionPlan(
  supabase: ReturnType<typeof createClient>,
  accountId: string
): Promise<Database["public"]["Tables"]["subscriptions"]["Row"]["plan"]> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", accountId)
    .maybeSingle();
  return data?.plan ?? "free";
}

/** Reaplica `position` 1..n conforme a ordem dos ids (guia kanban). */
export async function reorderKanbanStages(stageIdsOrdered: string[]): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("kanban_stages")
    .select("id")
    .eq("account_id", admin.accountId);

  if (fetchErr) return { ok: false, error: fetchErr.message };
  const allowed = new Set((existing ?? []).map((r) => r.id));
  if (stageIdsOrdered.length !== allowed.size) {
    return { ok: false, error: "Lista de etapas inválida." };
  }
  for (const id of stageIdsOrdered) {
    if (!allowed.has(id)) return { ok: false, error: "Etapa inválida." };
  }

  for (let i = 0; i < stageIdsOrdered.length; i++) {
    const { error } = await supabase
      .from("kanban_stages")
      .update({ position: i + 1 })
      .eq("id", stageIdsOrdered[i])
      .eq("account_id", admin.accountId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateKanbanStageName(stageId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome da etapa é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("kanban_stages")
    .update({ name: trimmed })
    .eq("id", stageId)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  return { ok: true };
}

export async function addKanbanStage(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome da etapa é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const plan = await getSubscriptionPlan(supabase, admin.accountId);

  const { count, error: countErr } = await supabase
    .from("kanban_stages")
    .select("*", { count: "exact", head: true })
    .eq("account_id", admin.accountId);

  if (countErr) return { ok: false, error: countErr.message };
  const n = count ?? 0;

  if (plan === "free" && n >= FREE_MAX_STAGES) {
    return {
      ok: false,
      error:
        "No plano Free você pode ter no máximo 4 etapas. Faça upgrade para o Pro para adicionar mais.",
    };
  }

  const { data: maxRow } = await supabase
    .from("kanban_stages")
    .select("position")
    .eq("account_id", admin.accountId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? 0) + 1;
  const color = STAGE_COLORS[(nextPosition - 1) % STAGE_COLORS.length];

  const { error } = await supabase.from("kanban_stages").insert({
    account_id: admin.accountId,
    name: trimmed,
    position: nextPosition,
    color,
    is_final: false,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteKanbanStage(stageId: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { count: stageCount, error: scErr } = await supabase
    .from("kanban_stages")
    .select("*", { count: "exact", head: true })
    .eq("account_id", admin.accountId);

  if (scErr) return { ok: false, error: scErr.message };
  if ((stageCount ?? 0) <= 1) {
    return { ok: false, error: "É necessário manter pelo menos uma etapa no kanban." };
  }

  const { count: jobCount, error: jErr } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("stage_id", stageId)
    .eq("account_id", admin.accountId);

  if (jErr) return { ok: false, error: jErr.message };

  if (jobCount && jobCount > 0) {
    return {
      ok: false,
      error: "Não é possível excluir: há jobs nesta etapa. Mova-os antes.",
    };
  }

  const { data: stageRow } = await supabase
    .from("kanban_stages")
    .select("is_final")
    .eq("id", stageId)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (!stageRow) return { ok: false, error: "Etapa não encontrada." };

  if (stageRow.is_final) {
    const { data: successor } = await supabase
      .from("kanban_stages")
      .select("id")
      .eq("account_id", admin.accountId)
      .neq("id", stageId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (successor) {
      await supabase.from("kanban_stages").update({ is_final: false }).eq("account_id", admin.accountId);

      await supabase
        .from("kanban_stages")
        .update({ is_final: true })
        .eq("id", successor.id)
        .eq("account_id", admin.accountId);
    }
  }

  const { error } = await supabase
    .from("kanban_stages")
    .delete()
    .eq("id", stageId)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Define uma única etapa como final (`is_final`). */
export async function setFinalKanbanStage(stageId: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { data: target } = await supabase
    .from("kanban_stages")
    .select("id")
    .eq("id", stageId)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Etapa não encontrada." };

  const { error: e1 } = await supabase
    .from("kanban_stages")
    .update({ is_final: false })
    .eq("account_id", admin.accountId);

  if (e1) return { ok: false, error: e1.message };

  const { error: e2 } = await supabase
    .from("kanban_stages")
    .update({ is_final: true })
    .eq("id", stageId)
    .eq("account_id", admin.accountId);

  if (e2) return { ok: false, error: e2.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}
