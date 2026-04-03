import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const DEFAULT_STAGES: {
  position: number;
  name: string;
  color: string;
  is_final: boolean;
}[] = [
  { position: 1, name: "Aguardando", color: "bg-violet-50", is_final: false },
  { position: 2, name: "Em Edição", color: "bg-amber-50", is_final: false },
  { position: 3, name: "Revisão", color: "bg-blue-50", is_final: false },
  { position: 4, name: "Aprovado", color: "bg-green-50", is_final: false },
  { position: 5, name: "Entregue", color: "bg-pink-50", is_final: true },
];

/**
 * Primeiro login Google: account, users (admin), account_members, kanban padrão, subscription free.
 */
export async function provisionNewStudio(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Meu estúdio";

  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  const { data: account, error: accErr } = await supabase
    .from("accounts")
    .insert({ name: displayName })
    .select("id")
    .single();

  if (accErr || !account) {
    return { ok: false, message: accErr?.message ?? "Falha ao criar conta" };
  }

  const accountId = account.id;

  const { error: userErr } = await supabase.from("users").insert({
    id: user.id,
    account_id: accountId,
    name: displayName,
    email: user.email ?? null,
    avatar_url: avatarUrl,
    role: "admin",
  });

  if (userErr) {
    return { ok: false, message: userErr.message };
  }

  const { error: memErr } = await supabase.from("account_members").insert({
    account_id: accountId,
    user_id: user.id,
    role: "admin",
  });

  if (memErr) {
    return { ok: false, message: memErr.message };
  }

  const { error: stagesErr } = await supabase.from("kanban_stages").insert(
    DEFAULT_STAGES.map((s) => ({
      account_id: accountId,
      name: s.name,
      position: s.position,
      color: s.color,
      is_final: s.is_final,
    }))
  );

  if (stagesErr) {
    return { ok: false, message: stagesErr.message };
  }

  const { error: subErr } = await supabase.from("subscriptions").insert({
    account_id: accountId,
    plan: "free",
    status: "active",
  });

  if (subErr) {
    return { ok: false, message: subErr.message };
  }

  return { ok: true };
}
