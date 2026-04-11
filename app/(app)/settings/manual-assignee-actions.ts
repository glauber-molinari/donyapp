"use server";

import { revalidatePath } from "next/cache";

import {
  removeManualAssigneePhotoAtUrl,
  uploadManualAssigneePhoto,
} from "@/lib/manual-assignee-photo";
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
    return { error: "Apenas administradores podem alterar responsáveis manuais." };
  }
  return { accountId: ctx.accountId };
}

async function assertProSoloAccount(
  supabase: ReturnType<typeof createClient>,
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", accountId)
    .maybeSingle();

  if ((sub?.plan ?? "free") !== "pro") {
    return { ok: false, error: "Responsáveis manuais estão disponíveis no plano Pro." };
  }

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId);

  if (error) return { ok: false, error: error.message };
  if ((count ?? 0) > 1) {
    return {
      ok: false,
      error:
        "Com mais de um usuário na conta, use a equipe em Configurações para atribuir responsáveis.",
    };
  }

  return { ok: true };
}

export async function addManualJobAssignee(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";

  if (!name) return { ok: false, error: "Nome é obrigatório." };
  if (!email) return { ok: false, error: "E-mail é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const gate = await assertProSoloAccount(supabase, admin.accountId);
  if (!gate.ok) return { ok: false, error: gate.error };

  let photo_url: string | null = null;
  const fileRaw = formData.get("photo");
  if (fileRaw instanceof File && fileRaw.size > 0) {
    const up = await uploadManualAssigneePhoto(supabase, admin.accountId, fileRaw);
    if (!up.ok) return { ok: false, error: up.error };
    photo_url = up.publicUrl;
  }

  const { data: maxRow } = await supabase
    .from("manual_job_assignees")
    .select("position")
    .eq("account_id", admin.accountId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? 0) + 1;

  const { error } = await supabase.from("manual_job_assignees").insert({
    account_id: admin.accountId,
    name,
    email,
    photo_url,
    position: nextPosition,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/kanban");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateManualJobAssignee(id: string, formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";

  if (!name) return { ok: false, error: "Nome é obrigatório." };
  if (!email) return { ok: false, error: "E-mail é obrigatório." };

  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const gate = await assertProSoloAccount(supabase, admin.accountId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: existing, error: exErr } = await supabase
    .from("manual_job_assignees")
    .select("photo_url")
    .eq("id", id)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (exErr) return { ok: false, error: exErr.message };
  if (!existing) return { ok: false, error: "Responsável não encontrado." };

  const clearPhoto = formData.get("clear_photo") === "1";
  const fileRaw = formData.get("photo");

  let photo_url: string | null = existing.photo_url;

  if (clearPhoto) {
    await removeManualAssigneePhotoAtUrl(supabase, existing.photo_url);
    photo_url = null;
  } else if (fileRaw instanceof File && fileRaw.size > 0) {
    const up = await uploadManualAssigneePhoto(supabase, admin.accountId, fileRaw);
    if (!up.ok) return { ok: false, error: up.error };
    await removeManualAssigneePhotoAtUrl(supabase, existing.photo_url);
    photo_url = up.publicUrl;
  }

  const { error } = await supabase
    .from("manual_job_assignees")
    .update({ name, email, photo_url })
    .eq("id", id)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/kanban");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteManualJobAssignee(id: string): Promise<ActionResult> {
  const ctx = await getAdminContext();
  const admin = requireAdmin(ctx);
  if ("error" in admin) return { ok: false, error: admin.error };

  const supabase = createClient();
  const gate = await assertProSoloAccount(supabase, admin.accountId);
  if (!gate.ok) return { ok: false, error: gate.error };

  const { data: row } = await supabase
    .from("manual_job_assignees")
    .select("photo_url")
    .eq("id", id)
    .eq("account_id", admin.accountId)
    .maybeSingle();

  if (row?.photo_url) {
    await removeManualAssigneePhotoAtUrl(supabase, row.photo_url);
  }

  const { error } = await supabase
    .from("manual_job_assignees")
    .delete()
    .eq("id", id)
    .eq("account_id", admin.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/kanban");
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { ok: true };
}
