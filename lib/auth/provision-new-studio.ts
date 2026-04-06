import type { SupabaseClient, User } from "@supabase/supabase-js";

import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import type { Database } from "@/types/database";

const DEFAULT_STAGES: {
  position: number;
  name: string;
  color: string;
  is_final: boolean;
}[] = [
  { position: 1, name: "Backup", color: "bg-ds-accent/10", is_final: false },
  { position: 2, name: "Em Edição", color: "bg-amber-50", is_final: false },
  { position: 3, name: "Em Aprovação", color: "bg-blue-50", is_final: false },
  { position: 4, name: "Entregue", color: "bg-pink-50", is_final: true },
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

  const avatarUrl = oauthAvatarUrlFromUser(user);

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

  const { error: workTypesErr } = await supabase.from("job_work_types").insert({
    account_id: accountId,
    name: "Geral",
    position: 1,
  });

  if (workTypesErr) {
    return { ok: false, message: workTypesErr.message };
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
