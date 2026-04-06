import type { User } from "@supabase/supabase-js";

function pickPictureString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function fromRecord(record: Record<string, unknown> | null | undefined): string | null {
  if (!record) return null;
  return (
    pickPictureString(record.avatar_url) ||
    pickPictureString(record.picture) ||
    pickPictureString(record.image) ||
    null
  );
}

/**
 * URL da foto do provedor OAuth (ex.: Google), a partir de metadados e identities.
 * O Supabase nem sempre replica `picture` em `user_metadata`; o Google costuma enviar em `identity_data`.
 */
export function oauthAvatarUrlFromUser(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta = fromRecord(meta);
  if (fromMeta) return fromMeta;

  for (const identity of user.identities ?? []) {
    const data = identity.identity_data as Record<string, unknown> | undefined;
    const fromIdentity = fromRecord(data);
    if (fromIdentity) return fromIdentity;
  }

  return null;
}
