"use server";

import { revalidatePath } from "next/cache";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Acesso negado." };
  }
  return { ok: true };
}

export async function approveSuggestion(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("feedback_suggestions")
    .update({ status: "approved", stage: "em_estudo" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
  return { ok: true };
}

export async function rejectSuggestion(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("feedback_suggestions")
    .update({ status: "rejected", stage: null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
  return { ok: true };
}

export async function updateStage(
  id: string,
  stage: "em_estudo" | "faremos" | "produzindo" | "pronto"
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const svc = createServiceRoleClient();
  if (!svc) return { ok: false, error: "Configuração do servidor incompleta." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc as any)
    .from("feedback_suggestions")
    .update({ stage })
    .eq("id", id)
    .eq("status", "approved");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/feedback");
  revalidatePath("/feedback");
  return { ok: true };
}
