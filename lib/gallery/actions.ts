"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";

import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { createClient } from "@/lib/supabase/server";
import { headObject, presignUpload } from "@/lib/r2/operations";
import { deleteObjects } from "@/lib/r2/operations";
import { extFromFilename, originalKey } from "@/lib/r2/keys";
import type { Gallery, GalleryFolder, GalleryPhoto, GallerySelection, GalleryWithCounts, UploadTicket, WatermarkConfig } from "@/types/gallery";

type ActionResult = { ok: true } | { ok: false; error: string };

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const SLUG_REGEX = /^[a-z0-9-]+$/;

// ---------------------------------------------------------------------------
// Helpers de contexto
// ---------------------------------------------------------------------------

async function getAccountContext(): Promise<
  | { accountId: string; userId: string; userName: string; userEmail: string | null }
  | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) return { error: "Conta não encontrada." };

  return {
    accountId: profile.account_id,
    userId: user.id,
    userName: profile.name ?? "Usuário",
    userEmail: profile.email ?? user.email ?? null,
  };
}

async function assertGaleriasEnabled(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const flagOn = await isFeatureEnabled("galerias");
  if (!flagOn) return { ok: false, error: "Módulo de Galerias não disponível." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.account_id) return { ok: false, error: "Conta não encontrada." };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (sub?.plan !== "pro") return { ok: false, error: "Recurso exclusivo do plano Pro." };
  return { ok: true };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

// ---------------------------------------------------------------------------
// Galerias — CRUD
// ---------------------------------------------------------------------------

export async function listGalleriesForAccount(): Promise<GalleryWithCounts[]> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return [];

  const supabase = createClient();
  const { data: galleries } = await supabase
    .from("galleries")
    .select("*")
    .eq("account_id", ctx.accountId)
    .order("created_at", { ascending: false });

  if (!galleries?.length) return [];

  const ids = galleries.map((g) => g.id);

  const [photosRes, foldersRes, selectionsRes] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("gallery_id")
      .in("gallery_id", ids),
    supabase
      .from("gallery_folders")
      .select("gallery_id")
      .in("gallery_id", ids),
    supabase
      .from("gallery_selections")
      .select("gallery_id")
      .in("gallery_id", ids),
  ]);

  const photoCounts = countBy(photosRes.data ?? [], "gallery_id");
  const folderCounts = countBy(foldersRes.data ?? [], "gallery_id");
  const selectionSet = new Set((selectionsRes.data ?? []).map((s) => s.gallery_id));

  return galleries.map((g) => ({
    ...(g as unknown as Gallery),
    photo_count: photoCounts[g.id] ?? 0,
    folder_count: folderCounts[g.id] ?? 0,
    has_selection: selectionSet.has(g.id),
  }));
}

function countBy<T extends Record<string, unknown>>(arr: T[], key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of arr) {
    const v = item[key] as string;
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

export async function createGallery(
  jobId: string,
  title: string
): Promise<{ ok: true; gallery: Gallery } | { ok: false; error: string }> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  // Uma galeria por job
  const { data: existing } = await supabase
    .from("galleries")
    .select("id")
    .eq("job_id", jobId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if (existing) return { ok: false, error: "Já existe uma galeria para este job." };

  // Gerar slug único
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  const slug = `${base}-${suffix}`;

  const { data, error } = await supabase
    .from("galleries")
    .insert({
      account_id: ctx.accountId,
      job_id: jobId,
      slug,
      title,
      created_by: ctx.userId,
    })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao criar galeria." };

  await supabase.from("gallery_folders").insert({
    gallery_id: data.id,
    name: "Destaques",
    display_order: 0,
  });

  revalidatePath("/galerias");
  return { ok: true, gallery: data as unknown as Gallery };
}

export async function getGallery(galleryId: string): Promise<Gallery | null> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*")
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  return data as unknown as Gallery | null;
}

export async function updateGallerySettings(
  galleryId: string,
  settings: {
    title?: string;
    slug?: string;
    password?: string | null;
    expires_at?: string | null;
    download_enabled?: boolean;
    favorite_enabled?: boolean;
    watermark_config?: WatermarkConfig | null;
  }
): Promise<ActionResult> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  if (settings.slug !== undefined) {
    if (!SLUG_REGEX.test(settings.slug)) {
      return { ok: false, error: "Slug inválido. Use apenas letras minúsculas, números e hífens." };
    }
    const { data: conflict } = await supabase
      .from("galleries")
      .select("id")
      .eq("slug", settings.slug)
      .neq("id", galleryId)
      .maybeSingle();
    if (conflict) return { ok: false, error: "Este slug já está em uso." };
  }

  const updateData: Record<string, unknown> = {};
  if (settings.title !== undefined) updateData.title = settings.title;
  if (settings.slug !== undefined) updateData.slug = settings.slug;
  if ("password" in settings) {
    updateData.password_hash = settings.password ? hashPassword(settings.password) : null;
  }
  if ("expires_at" in settings) updateData.expires_at = settings.expires_at;
  if (settings.download_enabled !== undefined) updateData.download_enabled = settings.download_enabled;
  if (settings.favorite_enabled !== undefined) updateData.favorite_enabled = settings.favorite_enabled;
  if ("watermark_config" in settings) updateData.watermark_config = settings.watermark_config ?? null;

  const { error } = await supabase
    .from("galleries")
    .update(updateData)
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/galerias");
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function setGalleryMode(
  galleryId: string,
  mode: "selection" | "delivery"
): Promise<ActionResult> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("galleries")
    .update({ mode })
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/galerias");
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function publishGallery(galleryId: string): Promise<ActionResult> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("galleries")
    .update({ status: "published" })
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/galerias");
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function archiveGallery(galleryId: string): Promise<ActionResult> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("galleries")
    .update({ status: "draft" })
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/galerias");
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function deleteGallery(galleryId: string): Promise<ActionResult> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  // Coletar r2_keys para deletar do R2
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("r2_key, id")
    .eq("gallery_id", galleryId);

  const { error } = await supabase
    .from("galleries")
    .delete()
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  // Deletar arquivos do R2 (best-effort)
  if (photos?.length) {
    const originals = photos.map((p) => p.r2_key);
    const watermarked = photos.map((p) => p.r2_key.replace("/original/", "/watermarked/").replace(/\.[^.]+$/, ".jpg"));
    await deleteObjects([...originals, ...watermarked]);
  }

  revalidatePath("/galerias");
  return { ok: true };
}

export async function setCoverPhoto(galleryId: string, photoId: string | null): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("galleries")
    .update({ cover_photo_id: photoId })
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pastas
// ---------------------------------------------------------------------------

export async function createFolder(galleryId: string, name: string): Promise<{ ok: true; folder: GalleryFolder } | { ok: false; error: string }> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();

  const { data: maxOrder } = await supabase
    .from("gallery_folders")
    .select("display_order")
    .eq("gallery_id", galleryId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("gallery_folders")
    .insert({ gallery_id: galleryId, name, display_order: (maxOrder?.display_order ?? -1) + 1 })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao criar pasta." };
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true, folder: data as unknown as GalleryFolder };
}

export async function renameFolder(folderId: string, name: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase.from("gallery_folders").update({ name }).eq("id", folderId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFolder(folderId: string, galleryId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  // Fotos da pasta voltam para sem-pasta (ON DELETE SET NULL)
  const { error } = await supabase.from("gallery_folders").delete().eq("id", folderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function reorderFolders(galleryId: string, orderedIds: string[]): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("gallery_folders").update({ display_order: index }).eq("id", id)
    )
  );
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------

export async function listPhotos(galleryId: string): Promise<GalleryPhoto[]> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("display_order", { ascending: true });

  return (data ?? []) as unknown as GalleryPhoto[];
}

/** Fase 1/2 do upload: gera URL assinada para PUT direto ao R2. */
export async function requestUploadUrl(
  galleryId: string,
  filename: string,
  contentType: string,
  sizeBytes: number
): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: string }> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  if (!ALLOWED_MIME.has(contentType)) {
    return { ok: false, error: "Somente JPEG e PNG são aceitos." };
  }
  if (sizeBytes > MAX_BYTES) {
    return { ok: false, error: "Foto deve ter no máximo 50 MB." };
  }

  const supabase = createClient();
  const { data: gallery } = await supabase
    .from("galleries")
    .select("id, job_id")
    .eq("id", galleryId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if (!gallery) return { ok: false, error: "Galeria não encontrada." };

  const photoId = crypto.randomUUID();
  const ext = extFromFilename(filename);
  const key = originalKey(ctx.accountId, gallery.job_id ?? "no-job", galleryId, photoId, ext);

  const url = await presignUpload(key, contentType);
  if (!url) return { ok: false, error: "R2 não configurado." };

  return { ok: true, ticket: { photoId, presignedUrl: url, r2Key: key } };
}

/** Fase 2/2 do upload: confirma existência no R2 e insere a linha no banco. */
export async function confirmUpload(
  galleryId: string,
  ticket: UploadTicket,
  filename: string,
  folderId: string | null
): Promise<{ ok: true; photo: GalleryPhoto } | { ok: false; error: string }> {
  const guard = await assertGaleriasEnabled();
  if (!guard.ok) return guard;

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  // Confirmar que o objeto realmente existe no R2
  const meta = await headObject(ticket.r2Key);
  if (!meta) return { ok: false, error: "Upload não encontrado no storage." };

  const supabase = createClient();
  const { data: maxOrder } = await supabase
    .from("gallery_photos")
    .select("display_order")
    .eq("gallery_id", galleryId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("gallery_photos")
    .insert({
      id: ticket.photoId,
      gallery_id: galleryId,
      folder_id: folderId ?? null,
      r2_key: ticket.r2Key,
      filename,
      size_bytes: meta.size,
      display_order: (maxOrder?.display_order ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao registrar foto." };

  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true, photo: data as unknown as GalleryPhoto };
}

export async function deletePhoto(photoId: string, galleryId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { data: photo } = await supabase
    .from("gallery_photos")
    .select("r2_key")
    .eq("id", photoId)
    .maybeSingle();

  const { error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", photoId);

  if (error) return { ok: false, error: error.message };

  if (photo?.r2_key) {
    const watermarked = photo.r2_key.replace("/original/", "/watermarked/").replace(/\.[^.]+$/, ".jpg");
    await deleteObjects([photo.r2_key, watermarked]);
  }

  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function reorderPhotos(galleryId: string, orderedIds: string[]): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("gallery_photos").update({ display_order: index }).eq("id", id)
    )
  );
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

export async function movePhotoToFolder(
  photoId: string,
  folderId: string | null,
  galleryId: string
): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("gallery_photos")
    .update({ folder_id: folderId })
    .eq("id", photoId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/galerias/${galleryId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Seleção do cliente (visão do fotógrafo)
// ---------------------------------------------------------------------------

export async function getGallerySelection(galleryId: string): Promise<GallerySelection | null> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("gallery_selections")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as unknown as GallerySelection | null;
}

export async function getSelectedPhotos(galleryId: string): Promise<GalleryPhoto[]> {
  const selection = await getGallerySelection(galleryId);
  if (!selection || selection.selected_photo_ids.length === 0) return [];

  const ctx = await getAccountContext();
  if ("error" in ctx) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .select("*")
    .in("id", selection.selected_photo_ids);

  return (data ?? []) as unknown as GalleryPhoto[];
}
