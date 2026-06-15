import { createClient } from "@/lib/supabase/server";

/** Fotógrafo logado da mesma conta da galeria (preview em rascunho). */
export async function isGalleryOwner(accountId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.account_id === accountId;
}

export function imageContentTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}
