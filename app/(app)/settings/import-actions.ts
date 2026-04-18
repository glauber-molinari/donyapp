"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { FREE_MAX_CONTACTS } from "@/lib/plan-limits";
import { isValidEmail } from "@/lib/validation/contact";

export type ImportContactRow = {
  name: string;
  email: string;
  phone: string | null;
};

export type ImportResult =
  | { ok: true; imported: number; skipped: number; limitReached: boolean }
  | { ok: false; error: string };

export async function importContacts(rows: ImportContactRow[]): Promise<ImportResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { ok: false, error: "Conta não encontrada para este usuário." };
  }

  const accountId = profile.account_id;

  // Valida as linhas recebidas
  const valid = rows.filter(
    (r) => r.name.trim() && r.email.trim() && isValidEmail(r.email.trim())
  );

  if (valid.length === 0) {
    return { ok: false, error: "Nenhum contato válido encontrado na planilha." };
  }

  // Verifica limite do plano Free
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", accountId)
    .maybeSingle();

  const plan = sub?.plan ?? "free";

  let toInsert = valid;
  let limitReached = false;

  if (plan === "free") {
    const { count: existing } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);

    const remaining = FREE_MAX_CONTACTS - (existing ?? 0);

    if (remaining <= 0) {
      return {
        ok: false,
        error: `Limite de ${FREE_MAX_CONTACTS} contatos atingido no plano Free. Faça upgrade em Configurações → Plano.`,
      };
    }

    if (valid.length > remaining) {
      toInsert = valid.slice(0, remaining);
      limitReached = true;
    }
  }

  const { error } = await supabase.from("contacts").insert(
    toInsert.map((r) => ({
      account_id: accountId,
      name: r.name.trim(),
      email: r.email.trim().toLowerCase(),
      phone: r.phone?.trim() || null,
      notes: null,
    }))
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/contacts");

  return {
    ok: true,
    imported: toInsert.length,
    skipped: rows.length - toInsert.length,
    limitReached,
  };
}
