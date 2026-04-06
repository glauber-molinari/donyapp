"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function saveDeliveryEmailTemplates(
  subject: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }

  const { data: me } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!me?.account_id || me.role !== "admin") {
    return { ok: false, error: "Apenas administradores podem alterar os templates." };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", me.account_id)
    .maybeSingle();

  if ((sub?.plan ?? "free") !== "pro") {
    return { ok: false, error: "Templates personalizados estão disponíveis no plano Pro." };
  }

  const subjectTrim = subject.trim();
  const bodyTrim = body.trim();

  const { error } = await supabase
    .from("accounts")
    .update({
      delivery_email_subject_template: subjectTrim || null,
      delivery_email_body_template: bodyTrim || null,
    })
    .eq("id", me.account_id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/settings/email");
  revalidatePath("/board");
  return { ok: true };
}
