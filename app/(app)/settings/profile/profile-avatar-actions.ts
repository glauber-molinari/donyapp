"use server";

import { revalidatePath } from "next/cache";

import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import {
  removeUserAvatarAtUrl,
  uploadUserProfileAvatar,
  pathFromUserAvatarPublicUrl,
} from "@/lib/user-avatar";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAvatarSurfaces() {
  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath("/board");
}

export async function uploadProfileAvatar(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const fileRaw = formData.get("photo");
  if (!(fileRaw instanceof File) || fileRaw.size === 0) {
    return { ok: false, error: "Escolha uma imagem." };
  }

  const { data: row } = await supabase
    .from("users")
    .select("avatar_url, avatar_is_custom")
    .eq("id", user.id)
    .maybeSingle();

  const previousUrl = row?.avatar_url ?? null;
  if (previousUrl && pathFromUserAvatarPublicUrl(previousUrl)) {
    await removeUserAvatarAtUrl(supabase, previousUrl);
  }

  const up = await uploadUserProfileAvatar(supabase, user.id, fileRaw);
  if (!up.ok) return { ok: false, error: up.error };

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: up.publicUrl, avatar_is_custom: true })
    .eq("id", user.id);

  if (error) {
    await removeUserAvatarAtUrl(supabase, up.publicUrl);
    return { ok: false, error: error.message };
  }

  revalidateAvatarSurfaces();
  return { ok: true };
}

export async function clearCustomProfileAvatar(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const { data: row } = await supabase
    .from("users")
    .select("avatar_url, avatar_is_custom")
    .eq("id", user.id)
    .maybeSingle();

  if (!row?.avatar_is_custom) {
    return { ok: true };
  }

  const previousUrl = row.avatar_url;
  if (previousUrl && pathFromUserAvatarPublicUrl(previousUrl)) {
    await removeUserAvatarAtUrl(supabase, previousUrl);
  }

  const oauthUrl = oauthAvatarUrlFromUser(user);

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: oauthUrl, avatar_is_custom: false })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidateAvatarSurfaces();
  return { ok: true };
}
