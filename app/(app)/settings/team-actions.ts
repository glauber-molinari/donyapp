"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function removeTeamMember(memberUserId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { data: adminRow } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow?.account_id || adminRow.role !== "admin") {
    return { ok: false, error: "Apenas administradores podem remover membros." };
  }

  const accountId = adminRow.account_id;

  const { data: target } = await supabase
    .from("users")
    .select("id, role, account_id")
    .eq("id", memberUserId)
    .maybeSingle();

  if (!target || target.account_id !== accountId) {
    return { ok: false, error: "Membro não encontrado." };
  }

  if (target.id === user.id) {
    return { ok: false, error: "Use outro administrador para remover seu acesso, ou peça suporte." };
  }

  if (target.role === "admin") {
    const { count, error: cntErr } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("role", "admin");

    if (cntErr || (count ?? 0) < 2) {
      return { ok: false, error: "É necessário manter pelo menos um administrador na conta." };
    }
  }

  const { error: delMemErr } = await supabase
    .from("account_members")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", memberUserId);

  if (delMemErr) {
    return { ok: false, error: "Não foi possível remover o membro da equipe." };
  }

  const { error: upErr } = await supabase
    .from("users")
    .update({ account_id: null })
    .eq("id", memberUserId);

  if (upErr) {
    return { ok: false, error: "Membro removido da lista, mas falhou ao atualizar o perfil." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
