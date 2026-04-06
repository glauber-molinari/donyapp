"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

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

function requireAdmin(ctx: AdminContext): { accountId: string } | { error: string } {
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  if (!ctx.isAdmin) {
    return { error: "Apenas administradores podem alterar os tipos de trabalho." };
  }
  return { accountId: ctx.accountId };
}

export async function addJobWorkType(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { data: maxRow } = await supabase
    .from("job_work_types")
    .select("position")
    .eq("account_id", admin.accountId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? 0) + 1;

  const { error } = await supabase.from("job_work_types").insert({
    account_id: admin.accountId,
    name: trimmed,
    position: nextPosition,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteJobWorkType(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();

  const { count, error: countErr } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("work_type_id", id)
    .eq("account_id", admin.accountId);

  if (countErr) return { ok: false, error: countErr.message };
  if (count && count > 0) {
    return {
      ok: false,
      error: "Não é possível excluir: existem jobs usando este tipo de trabalho.",
    };
  }

  const { error } = await supabase
    .from("job_work_types")
    .delete()
    .eq("id", id)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}
