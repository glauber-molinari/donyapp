import type { SupabaseClient, User } from "@supabase/supabase-js";

import { inviteTokenFromNext } from "@/lib/auth/next-path";
import type { Database } from "@/types/database";

export function inviteTokenFromUserMetadata(user: User): string | null {
  const raw = user.user_metadata?.invite_token;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  return null;
}

/**
 * Resolve o token do convite: query `next`, metadata do signup ou convite pendente no e-mail.
 */
export async function resolveInviteToken(
  db: SupabaseClient<Database>,
  user: User,
  nextPath: string
): Promise<string | null> {
  const fromNext = inviteTokenFromNext(nextPath);
  if (fromNext) return fromNext;

  const fromMeta = inviteTokenFromUserMetadata(user);
  if (fromMeta) return fromMeta;

  const email = user.email?.trim().toLowerCase();
  if (!email) return null;

  const { data } = await db
    .from("invitations")
    .select("token")
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.token ?? null;
}
