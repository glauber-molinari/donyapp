import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, UserRole } from "@/types/database";

/**
 * Corrige usuário que caiu em estúdio próprio vazio após convite (bug do redirect do Supabase).
 * Só aplica se a conta solo estiver vazia (sem jobs/contatos) e for o único membro.
 */
export async function repairMisprovisionedInvite(
  db: SupabaseClient<Database>,
  user: User,
  token: string
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "email" | "unsafe" | "not_applicable" }> {
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

  const { data: profile } = await db
    .from("users")
    .select("id, account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { ok: false, reason: "not_applicable" };
  }

  if (profile.account_id === inv.account_id) {
    return { ok: false, reason: "not_applicable" };
  }

  const soloAccountId = profile.account_id;

  const { count: memberCount } = await db
    .from("account_members")
    .select("user_id", { count: "exact", head: true })
    .eq("account_id", soloAccountId);

  if ((memberCount ?? 0) !== 1) {
    return { ok: false, reason: "unsafe" };
  }

  const [{ count: jobCount }, { count: contactCount }] = await Promise.all([
    db.from("jobs").select("id", { count: "exact", head: true }).eq("account_id", soloAccountId),
    db.from("contacts").select("id", { count: "exact", head: true }).eq("account_id", soloAccountId),
  ]);

  if ((jobCount ?? 0) > 0 || (contactCount ?? 0) > 0) {
    return { ok: false, reason: "unsafe" };
  }

  const role = (inv.role === "admin" ? "admin" : "member") as UserRole;

  const { error: userErr } = await db
    .from("users")
    .update({ account_id: inv.account_id, role })
    .eq("id", user.id);

  if (userErr) {
    console.error("repairMisprovisionedInvite users update:", userErr);
    return { ok: false, reason: "invalid" };
  }

  const { error: memErr } = await db.from("account_members").insert({
    account_id: inv.account_id,
    user_id: user.id,
    role,
  });

  if (memErr) {
    console.error("repairMisprovisionedInvite account_members insert:", memErr);
    await db
      .from("users")
      .update({ account_id: soloAccountId, role: profile.role })
      .eq("id", user.id);
    return { ok: false, reason: "invalid" };
  }

  await db.from("account_members").delete().eq("user_id", user.id).eq("account_id", soloAccountId);

  const { error: delAccErr } = await db.from("accounts").delete().eq("id", soloAccountId);
  if (delAccErr) {
    console.warn("repairMisprovisionedInvite accounts delete:", delAccErr);
  }

  const { error: upErr } = await db
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id);

  if (upErr) {
    console.error("repairMisprovisionedInvite invitation update:", upErr);
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, extra_users")
    .eq("account_id", inv.account_id)
    .maybeSingle();

  if (sub?.plan === "pro") {
    const next = (sub.extra_users ?? 0) + 1;
    await db
      .from("subscriptions")
      .update({ extra_users: next })
      .eq("account_id", inv.account_id);
  }

  return { ok: true };
}
