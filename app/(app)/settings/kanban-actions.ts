"use server";

import { revalidatePath } from "next/cache";

import { ensureAlbumStages } from "@/lib/auth/provision-album-stages";
import {
  isValidKanbanStageColor,
  pickNextKanbanStageColor,
} from "@/lib/kanban-stage-colors";
import { canCreateAlbum } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";
import type { BoardType, Database } from "@/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Plano Free: no máximo 4 etapas no quadro de Edições. Pro: ilimitado. Álbum é Pro-only. */
const FREE_MAX_STAGES = 4;

function normalizeBoardType(value: unknown): BoardType {
  return value === "album" ? "album" : "edicao";
}

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
export async function reorderKanbanStages(
  stageIdsOrdered: string[],
  boardType: BoardType = "edicao"
): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const board = normalizeBoardType(boardType);
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("kanban_stages")
    .select("id")
    .eq("account_id", admin.accountId)
    .eq("board_type", board);

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

export async function updateKanbanStageDetails(
  stageId: string,
  name: string,
  color: string
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome da etapa é obrigatório." };

  const trimmedColor = color.trim();
  if (!isValidKanbanStageColor(trimmedColor)) {
    return {
      ok: false,
      error: "Cor inválida. Use um dos tons sugeridos ou um hexadecimal no formato #RRGGBB.",
    };
  }

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("kanban_stages")
    .update({ name: trimmed, color: trimmedColor })
    .eq("id", stageId)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  return { ok: true };
}

export async function addKanbanStage(
  name: string,
  boardType: BoardType = "edicao"
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome da etapa é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const board = normalizeBoardType(boardType);
  const supabase = createClient();
  const plan = await getSubscriptionPlan(supabase, admin.accountId);

  if (board === "album" && !canCreateAlbum(plan)) {
    return {
      ok: false,
      error: "Etapas de álbum estão disponíveis no plano Pro.",
    };
  }

  const { count, error: countErr } = await supabase
    .from("kanban_stages")
    .select("*", { count: "exact", head: true })
    .eq("account_id", admin.accountId)
    .eq("board_type", board);

  if (countErr) return { ok: false, error: countErr.message };
  const n = count ?? 0;

  if (board === "edicao" && plan === "free" && n >= FREE_MAX_STAGES) {
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
    .eq("board_type", board)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? 0) + 1;

  const { data: colorRows, error: colorFetchErr } = await supabase
    .from("kanban_stages")
    .select("color")
    .eq("account_id", admin.accountId)
    .eq("board_type", board);

  if (colorFetchErr) return { ok: false, error: colorFetchErr.message };

  const color = pickNextKanbanStageColor((colorRows ?? []).map((r) => r.color));

  const { error } = await supabase.from("kanban_stages").insert({
    account_id: admin.accountId,
    name: trimmed,
    position: nextPosition,
    color,
    is_final: false,
    board_type: board,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Liga/desliga o quadro de Álbuns para a conta. Apenas admin Pro pode ativar.
 * Ao ativar, provisiona as etapas padrão se ainda não existirem.
 */
export async function toggleAlbumBoard(enabled: boolean): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  if (enabled) {
    const plan = await getSubscriptionPlan(supabase, admin.accountId);
    if (!canCreateAlbum(plan)) {
      return { ok: false, error: "Ativar o quadro de Álbuns exige plano Pro." };
    }
    const ensured = await ensureAlbumStages(supabase, admin.accountId);
    if (!ensured.ok) return ensured;
  }

  const { error } = await supabase
    .from("accounts")
    .update({ album_board_enabled: enabled })
    .eq("id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  return { ok: true };
}

export async function deleteKanbanStage(stageId: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { data: stageRow } = await supabase
    .from("kanban_stages")
    .select("is_final, board_type")
    .eq("id", stageId)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (!stageRow) return { ok: false, error: "Etapa não encontrada." };
  const board = (stageRow.board_type as BoardType) ?? "edicao";

  const { count: stageCount, error: scErr } = await supabase
    .from("kanban_stages")
    .select("*", { count: "exact", head: true })
    .eq("account_id", admin.accountId)
    .eq("board_type", board);

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

  if (stageRow.is_final) {
    const { data: successor } = await supabase
      .from("kanban_stages")
      .select("id")
      .eq("account_id", admin.accountId)
      .eq("board_type", board)
      .neq("id", stageId)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (successor) {
      await supabase
        .from("kanban_stages")
        .update({ is_final: false })
        .eq("account_id", admin.accountId)
        .eq("board_type", board);

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

/** Define uma única etapa como final (`is_final`) dentro do board_type da etapa. */
export async function setFinalKanbanStage(stageId: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { data: target } = await supabase
    .from("kanban_stages")
    .select("id, board_type")
    .eq("id", stageId)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Etapa não encontrada." };
  const board = (target.board_type as BoardType) ?? "edicao";

  const { error: e1 } = await supabase
    .from("kanban_stages")
    .update({ is_final: false })
    .eq("account_id", admin.accountId)
    .eq("board_type", board);

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
