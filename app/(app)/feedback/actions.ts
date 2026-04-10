"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getUserContext(): Promise<{ userId: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  return { userId: user.id };
}

export async function submitFeedback(formData: FormData): Promise<ActionResult> {
  const ctx = await getUserContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const title = (formData.get("title") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) return { ok: false, error: "Título é obrigatório." };
  if (title.length > 120) return { ok: false, error: "Título deve ter no máximo 120 caracteres." };

  const supabase = createClient();
  const { error } = await supabase.from("feedback_suggestions").insert({
    title,
    description,
    user_id: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/feedback");
  return { ok: true };
}

export async function toggleVote(suggestionId: string): Promise<ActionResult> {
  const ctx = await getUserContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  // Verifica se já votou
  const { data: existing } = await supabase
    .from("feedback_votes")
    .select("id")
    .eq("suggestion_id", suggestionId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (existing) {
    // Remove voto
    const { error } = await supabase
      .from("feedback_votes")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    // Adiciona voto
    const { error } = await supabase.from("feedback_votes").insert({
      suggestion_id: suggestionId,
      user_id: ctx.userId,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/feedback");
  return { ok: true };
}
