"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_LENGTH = 120;

export async function saveCompanyName(rawName: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const { data: me } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!me?.account_id) {
    return { ok: false, error: "Conta não encontrada." };
  }

  if (me.role !== "admin") {
    return { ok: false, error: "Apenas administradores podem alterar o nome da empresa." };
  }

  const name = rawName.trim();
  if (!name) {
    return { ok: false, error: "Informe o nome da empresa." };
  }

  if (name.length > MAX_LENGTH) {
    return { ok: false, error: `Use no máximo ${MAX_LENGTH} caracteres.` };
  }

  const { error } = await supabase
    .from("accounts")
    .update({ name })
    .eq("id", me.account_id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/settings/profile");
  return { ok: true };
}
