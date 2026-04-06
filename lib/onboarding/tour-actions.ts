"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function markTourCompleted(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }
  const { error } = await supabase.from("users").update({ tour_completed: true }).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath("/board");
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetTour(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Não autenticado." };
  }
  const { error } = await supabase.from("users").update({ tour_completed: false }).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath("/board");
  revalidatePath("/settings");
  return { ok: true };
}
