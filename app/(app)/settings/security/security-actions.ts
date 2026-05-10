"use server";

import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; message: string } | { ok: false; error: string };

// Troca de senha é feita client-side via reauthenticate() + updateUser({ nonce }).
// Esta action existe apenas para troca de email, que pode ficar server-side.

export async function changeEmail(newEmail: string): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Não autenticado." };

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || trimmed === user.email?.toLowerCase()) {
    return { ok: false, error: "Informe um email diferente do atual." };
  }

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { ok: false, error: "Não foi possível solicitar a troca de email." };

  return {
    ok: true,
    message: `Confirmação enviada para ${trimmed}. O email só muda após você confirmar o link.`,
  };
}
