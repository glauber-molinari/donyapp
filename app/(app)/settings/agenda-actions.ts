"use server";

import { revalidatePath } from "next/cache";

import { deleteIntegration } from "@/lib/google-calendar/integration-db";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

export async function disconnectGoogleCalendar(): Promise<
  { ok: true } | { ok: false; error: string }
> {
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
    return { ok: false, error: "Apenas administradores podem desconectar a agenda." };
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return { ok: false, error: "Servidor sem service role configurada." };
  }

  const del = await deleteIntegration(me.account_id);
  if (!del.ok) {
    return { ok: false, error: "Não foi possível desconectar." };
  }

  revalidatePath("/settings/agenda");
  revalidatePath("/agenda");
  return { ok: true };
}
