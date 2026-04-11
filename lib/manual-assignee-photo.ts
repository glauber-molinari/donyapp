import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const MANUAL_ASSIGNEE_PHOTOS_BUCKET = "manual-assignee-photos";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 2.5 * 1024 * 1024;

/** Extrai o path no bucket a partir da URL pública do Supabase Storage. */
export function pathFromManualAssigneePhotoPublicUrl(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = "/storage/v1/object/public/manual-assignee-photos/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + marker.length);
    return decodeURIComponent(rest.split("?")[0] ?? "");
  } catch {
    return null;
  }
}

export async function removeManualAssigneePhotoAtUrl(
  supabase: SupabaseClient<Database>,
  publicUrl: string | null | undefined
): Promise<void> {
  if (!publicUrl?.trim()) return;
  const path = pathFromManualAssigneePhotoPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(MANUAL_ASSIGNEE_PHOTOS_BUCKET).remove([path]);
}

export async function uploadManualAssigneePhoto(
  supabase: SupabaseClient<Database>,
  accountId: string,
  file: File
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (!file.size) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "A imagem deve ter no máximo 2,5 MB." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use JPG, PNG, WebP ou GIF." };
  }
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Formato de imagem não suportado." };
  }

  const path = `${accountId}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(MANUAL_ASSIGNEE_PHOTOS_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(MANUAL_ASSIGNEE_PHOTOS_BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}
