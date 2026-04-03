"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail, normalizeOptionalText } from "@/lib/validation/contact";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getAccountContext(): Promise<{ accountId: string } | { error: string }> {
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

  return { accountId: profile.account_id };
}

type StageRow = { is_final: boolean } | null;

function jobIsActive(stageId: string | null, stage: StageRow): boolean {
  if (!stageId) return true;
  if (!stage) return true;
  return !stage.is_final;
}

export async function createContact(formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const phone = normalizeOptionalText(formData.get("phone"));
  const notes = normalizeOptionalText(formData.get("notes"));

  if (!name) return { ok: false, error: "Nome é obrigatório." };
  if (!email) return { ok: false, error: "E-mail é obrigatório." };
  if (!isValidEmail(email)) return { ok: false, error: "E-mail inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    account_id: ctx.accountId,
    name,
    email,
    phone,
    notes,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { ok: true };
}

export async function updateContact(
  contactId: string,
  formData: FormData
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const phone = normalizeOptionalText(formData.get("phone"));
  const notes = normalizeOptionalText(formData.get("notes"));

  if (!name) return { ok: false, error: "Nome é obrigatório." };
  if (!email) return { ok: false, error: "E-mail é obrigatório." };
  if (!isValidEmail(email)) return { ok: false, error: "E-mail inválido." };

  const supabase = createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ name, email, phone, notes })
    .eq("id", contactId)
    .eq("account_id", ctx.accountId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  const { data: jobs, error: jobsErr } = await supabase
    .from("jobs")
    .select("id, stage_id, kanban_stages(is_final)")
    .eq("contact_id", contactId)
    .eq("account_id", ctx.accountId);

  if (jobsErr) {
    return { ok: false, error: jobsErr.message };
  }

  for (const row of jobs ?? []) {
    const nested = row.kanban_stages as unknown;
    const stage: StageRow = Array.isArray(nested)
      ? ((nested[0] as { is_final: boolean } | undefined) ?? null)
      : (nested as { is_final: boolean } | null);
    if (jobIsActive(row.stage_id, stage)) {
      return {
        ok: false,
        error:
          "Não é possível excluir: há jobs ativos vinculados a este contato. Conclua ou mova os jobs para “Entregue” antes.",
      };
    }
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("account_id", ctx.accountId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/contacts");
  return { ok: true };
}
