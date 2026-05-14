import type { User } from "@supabase/supabase-js";

import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { pathFromUserAvatarPublicUrl } from "@/lib/user-avatar";

export type UserAvatarProfile = {
  avatar_url: string | null;
  avatar_is_custom?: boolean | null;
};

/**
 * URL exibida no app: upload no nosso bucket ou foto marcada como custom vencem.
 * Caso contrário, prefere a foto vinda do JWT OAuth (ex.: Google), que costuma ser
 * mais atual que `users.avatar_url` copiada no login — URL antiga no DB quebra a imagem
 * até um refresh “sortear” CDN ou até o callback regravar.
 */
export function resolveDisplayAvatarUrl(
  user: User,
  profile: UserAvatarProfile | null | undefined
): string | null {
  const stored = typeof profile?.avatar_url === "string" ? profile.avatar_url.trim() : "";
  const storedOrNull = stored.length > 0 ? stored : null;
  const oauth = oauthAvatarUrlFromUser(user);
  const isCustom = Boolean(profile?.avatar_is_custom);
  const isOurUpload = Boolean(storedOrNull && pathFromUserAvatarPublicUrl(storedOrNull));

  if (isOurUpload || (isCustom && storedOrNull)) {
    return storedOrNull;
  }

  return oauth ?? storedOrNull ?? null;
}
