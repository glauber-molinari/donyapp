import { applyWatermark } from "@/lib/gallery/watermark";
import { watermarkConfigCacheKey } from "@/lib/gallery/watermark-cache-key";
import {
  fetchWatermarkLogoBuffer,
  resolveWatermarkConfig,
} from "@/lib/gallery/watermark-resolve";
import {
  JPEG_QUALITY_CLEAN,
  JPEG_QUALITY_WATERMARK,
  PREGENERATE_CLEAN_WIDTHS,
  PREGENERATE_WM_GRID_WIDTHS,
  PREGENERATE_WM_LIGHTBOX_WIDTH,
} from "@/lib/gallery/image-variants";
import { getObjectBytes, headObject, putObjectBytes } from "@/lib/r2/operations";
import { resizedKeyFromOriginal, watermarkedKeyFromOriginal } from "@/lib/r2/keys";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WatermarkConfig } from "@/types/gallery";

/** Redimensiona para JPEG otimizado (progressive, sem ampliação). */
export async function resizeToJpeg(
  original: Buffer,
  width: number,
  quality = JPEG_QUALITY_CLEAN
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(original)
    .rotate()
    .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toBuffer();
}

/** Gera e grava variante limpa se ainda não existir no R2. */
export async function ensureCleanVariant(
  original: Buffer,
  r2Key: string,
  photoId: string,
  width: number
): Promise<void> {
  const key = resizedKeyFromOriginal(r2Key, photoId, width);
  if (await headObject(key)) return;
  const thumb = await resizeToJpeg(original, width, JPEG_QUALITY_CLEAN);
  await putObjectBytes(key, thumb, "image/jpeg");
}

/** Gera e grava variante com marca d'água se ainda não existir. */
export async function ensureWatermarkedVariant(
  original: Buffer,
  r2Key: string,
  photoId: string,
  width: number,
  variant: "view" | "lightbox",
  wmConfig: WatermarkConfig,
  logoBuffer: Buffer | null,
  configKey: string
): Promise<void> {
  const key = watermarkedKeyFromOriginal(r2Key, photoId, width, { variant, configKey });
  if (await headObject(key)) return;

  const srcBuffer =
    width > 0 ? await resizeToJpeg(original, width, JPEG_QUALITY_CLEAN) : original;

  const watermarked = await applyWatermark(
    srcBuffer,
    wmConfig,
    logoBuffer,
    JPEG_QUALITY_WATERMARK
  );
  await putObjectBytes(key, watermarked, "image/jpeg");
}

export type PregenerateResult = { photoId: string; generated: number; skipped: boolean };

/** Pré-gera variantes de uma foto (limpas + com WM se modo seleção). */
export async function pregeneratePhotoVariants(photoId: string): Promise<PregenerateResult> {
  const svc = createServiceRoleClient();
  if (!svc) return { photoId, generated: 0, skipped: true };

  const { data: photo } = await svc
    .from("gallery_photos")
    .select(
      "r2_key, galleries!gallery_photos_gallery_id_fkey(mode, account_id)"
    )
    .eq("id", photoId)
    .maybeSingle();

  const gallery = photo?.galleries;
  if (!photo?.r2_key || !gallery) return { photoId, generated: 0, skipped: true };

  const original = await getObjectBytes(photo.r2_key);
  if (!original) return { photoId, generated: 0, skipped: true };

  let generated = 0;
  const countIfNew = async (fn: () => Promise<void>) => {
    await fn();
    generated++;
  };

  for (const width of PREGENERATE_CLEAN_WIDTHS) {
    const key = resizedKeyFromOriginal(photo.r2_key, photoId, width);
    if (await headObject(key)) continue;
    await countIfNew(() => ensureCleanVariant(original, photo.r2_key, photoId, width));
  }

  if (gallery.mode === "selection") {
    const { data: account } = await svc
      .from("accounts")
      .select("watermark_config, watermark_logo_url, name")
      .eq("id", gallery.account_id)
      .maybeSingle();

    const wmConfig = resolveWatermarkConfig(
      (account?.watermark_config ?? null) as WatermarkConfig | null,
      account?.name
    );
    const configKey = watermarkConfigCacheKey(wmConfig, account?.watermark_logo_url);
    const logoBuffer = await fetchWatermarkLogoBuffer(account?.watermark_logo_url);

    for (const width of PREGENERATE_WM_GRID_WIDTHS) {
      const key = watermarkedKeyFromOriginal(photo.r2_key, photoId, width, {
        variant: "view",
        configKey,
      });
      if (await headObject(key)) continue;
      await countIfNew(() =>
        ensureWatermarkedVariant(
          original,
          photo.r2_key,
          photoId,
          width,
          "view",
          wmConfig,
          logoBuffer,
          configKey
        )
      );
    }

    const lbKey = watermarkedKeyFromOriginal(
      photo.r2_key,
      photoId,
      PREGENERATE_WM_LIGHTBOX_WIDTH,
      { variant: "lightbox", configKey }
    );
    if (!(await headObject(lbKey))) {
      await countIfNew(() =>
        ensureWatermarkedVariant(
          original,
          photo.r2_key,
          photoId,
          PREGENERATE_WM_LIGHTBOX_WIDTH,
          "lightbox",
          wmConfig,
          logoBuffer,
          configKey
        )
      );
    }
  }

  return { photoId, generated, skipped: false };
}

/** Pré-gera variantes de todas as fotos de uma galeria (sequencial, economiza memória). */
export async function pregenerateGalleryVariants(
  galleryId: string
): Promise<{ total: number; processed: number }> {
  const svc = createServiceRoleClient();
  if (!svc) return { total: 0, processed: 0 };

  const { data: photos } = await svc
    .from("gallery_photos")
    .select("id")
    .eq("gallery_id", galleryId)
    .order("display_order");

  if (!photos?.length) return { total: 0, processed: 0 };

  let processed = 0;
  for (const { id } of photos) {
    await pregeneratePhotoVariants(id);
    processed++;
  }

  return { total: photos.length, processed };
}
