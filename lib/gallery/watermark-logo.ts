import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const WATERMARK_LOGOS_BUCKET = "gallery-watermarks";

const ALLOWED_TYPES = new Set(["image/png", "image/svg+xml", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export function pathFromWatermarkLogoUrl(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${WATERMARK_LOGOS_BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + marker.length);
    return decodeURIComponent(rest.split("?")[0] ?? "");
  } catch {
    return null;
  }
}

export async function removeWatermarkLogo(
  supabase: SupabaseClient<Database>,
  publicUrl: string | null | undefined
): Promise<void> {
  if (!publicUrl?.trim()) return;
  const path = pathFromWatermarkLogoUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(WATERMARK_LOGOS_BUCKET).remove([path]);
}

export async function uploadWatermarkLogo(
  supabase: SupabaseClient<Database>,
  accountId: string,
  file: File
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (!file.size) return { ok: false, error: "Arquivo vazio." };
  if (file.size > MAX_BYTES) return { ok: false, error: "O logo deve ter no máximo 2 MB." };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: "Use PNG, SVG ou WebP." };

  const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/webp" ? "webp" : "png";
  const path = `${accountId}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(WATERMARK_LOGOS_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(WATERMARK_LOGOS_BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl };
}
