import type { SupabaseClient, User } from "@supabase/supabase-js";

import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import type { Database, UserRole } from "@/types/database";

/**
 * Primeiro login com convite válido: cria `users` + `account_members` e marca convite aceito.
 * Usar apenas com service role (callback OAuth).
 */
export async function acceptInvitationForNewUser(
  db: SupabaseClient<Database>,
  user: User,
  token: string
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "email" | "exists" }> {
  const t = token.trim();
  if (!t) {
    return { ok: false, reason: "invalid" };
  }

  const { data: inv, error: invErr } = await db
    .from("invitations")
    .select("id, account_id, email, role, accepted_at, expires_at")
    .eq("token", t)
    .maybeSingle();

  if (invErr || !inv || inv.accepted_at || new Date(inv.expires_at) <= new Date()) {
    return { ok: false, reason: "invalid" };
  }

  const userEmail = user.email?.trim().toLowerCase() ?? "";
  if (!userEmail || inv.email.trim().toLowerCase() !== userEmail) {
    return { ok: false, reason: "email" };
  }

  const { data: existing } = await db.from("users").select("id").eq("id", user.id).maybeSingle();
  if (existing) {
    return { ok: false, reason: "exists" };
  }

  const meta = user.user_metadata ?? {};
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Membro";
  const avatarUrl = oauthAvatarUrlFromUser(user);

  const role = (inv.role === "admin" ? "admin" : "member") as UserRole;

  const { error: userErr } = await db.from("users").insert({
    id: user.id,
    account_id: inv.account_id,
    name: displayName,
    email: user.email ?? null,
    avatar_url: avatarUrl,
    role,
  });

  if (userErr) {
    console.error("acceptInvitation users insert:", userErr);
    return { ok: false, reason: "invalid" };
  }

  const { error: memErr } = await db.from("account_members").insert({
    account_id: inv.account_id,
    user_id: user.id,
    role,
  });

  if (memErr) {
    console.error("acceptInvitation account_members insert:", memErr);
    await db.from("users").delete().eq("id", user.id);
    return { ok: false, reason: "invalid" };
  }

  const { error: upErr } = await db
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id);

  if (upErr) {
    console.error("acceptInvitation invitation update:", upErr);
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, extra_users")
    .eq("account_id", inv.account_id)
    .maybeSingle();

  if (sub?.plan === "pro") {
    const next = (sub.extra_users ?? 0) + 1;
    const { error: exErr } = await db
      .from("subscriptions")
      .update({ extra_users: next })
      .eq("account_id", inv.account_id);
    if (exErr) {
      console.error("acceptInvitation extra_users:", exErr);
    }
  }

  return { ok: true };
}
