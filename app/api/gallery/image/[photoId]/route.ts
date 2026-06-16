import { NextRequest, NextResponse } from "next/server";

import { isGalleryOwner, imageContentTypeFromFilename } from "@/lib/gallery/gallery-access";
import { watermarkConfigCacheKey } from "@/lib/gallery/watermark-cache-key";
import { fetchWatermarkLogoBuffer, resolveWatermarkConfig } from "@/lib/gallery/watermark-resolve";
import { applyWatermark } from "@/lib/gallery/watermark";
import {
  gallerySessionCookieName,
  hasGallerySession,
} from "@/lib/gallery/gallery-session";
import { getObjectBytes, headObject, putObjectBytes } from "@/lib/r2/operations";
import { resizedKeyFromOriginal, watermarkedKeyFromOriginal } from "@/lib/r2/keys";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WatermarkConfig } from "@/types/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const PUBLIC_WM_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
} as const;

const WATERMARK_CACHE_HEADERS = {
  "Cache-Control": "private, immutable, max-age=86400",
} as const;

/** Original ou miniatura redimensionada, sem marca d'água. */
async function serveCleanImage(
  r2Key: string,
  photoId: string,
  filename: string,
  width?: number
): Promise<NextResponse> {
  const originalContentType = imageContentTypeFromFilename(filename);

  if (!width) {
    const bytes = await getObjectBytes(r2Key);
    if (!bytes) return NextResponse.json({ error: "Not in storage" }, { status: 404 });
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": originalContentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const thumbKey = resizedKeyFromOriginal(r2Key, photoId, width);
  const cachedThumb = await headObject(thumbKey);
  if (cachedThumb) {
    const bytes = await getObjectBytes(thumbKey);
    if (bytes) {
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, immutable, max-age=86400",
        },
      });
    }
  }

  const original = await getObjectBytes(r2Key);
  if (!original) return NextResponse.json({ error: "Not in storage" }, { status: 404 });

  const sharp = (await import("sharp")).default;
  const thumb = await sharp(original)
    .rotate()
    .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();

  void putObjectBytes(thumbKey, thumb, "image/jpeg").catch(() => {});

  return new NextResponse(new Uint8Array(thumb), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, immutable, max-age=86400",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  const { photoId } = params;
  const widthParam = request.nextUrl.searchParams.get("w");
  const width = widthParam ? Number(widthParam) : undefined;

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
  }

  // Fetch photo
  const { data: photo } = await svc
    .from("gallery_photos")
    .select("gallery_id, r2_key, filename")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch gallery
  const { data: gallery } = await svc
    .from("galleries")
    .select("mode, status, expires_at, account_id, password_hash, cover_photo_id")
    .eq("id", photo.gallery_id)
    .maybeSingle();

  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPublished = gallery.status === "published";

  // Identifica a foto de capa (acesso antes da senha no hero).
  let isCoverPhoto = gallery.cover_photo_id === photoId;
  if (!isCoverPhoto && !gallery.cover_photo_id) {
    const { data: firstPhoto } = await svc
      .from("gallery_photos")
      .select("id")
      .eq("gallery_id", photo.gallery_id)
      .order("display_order")
      .limit(1)
      .maybeSingle();
    isCoverPhoto = firstPhoto?.id === photoId;
  }

  const hasValidSession =
    !gallery.password_hash ||
    isCoverPhoto ||
    hasGallerySession(
      photo.gallery_id,
      request.cookies.get(gallerySessionCookieName(photo.gallery_id))?.value
    );
  const isExpired = gallery.expires_at
    ? new Date(gallery.expires_at) < new Date()
    : false;

  // Caminho rápido do visitante público: publicada, com senha válida (se houver) e não expirada.
  const publicAllowed = isPublished && hasValidSession && !isExpired;

  const isOwner = await isGalleryOwner(gallery.account_id);

  if (!publicAllowed && !isOwner) {
    if (isPublished && !hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isExpired) {
      return NextResponse.json({ error: "Gallery expired" }, { status: 410 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r2Key = photo.r2_key;

  // Modo entrega: sempre sem marca d'água.
  if (gallery.mode === "delivery") {
    return serveCleanImage(r2Key, photoId, photo.filename, width);
  }

  // Modo seleção: sem marca só no hero da capa (cover=1) ou no painel do fotógrafo (ctx=manage).
  const isCoverDisplay =
    request.nextUrl.searchParams.get("cover") === "1" && isCoverPhoto;
  const isManageContext = request.nextUrl.searchParams.get("ctx") === "manage";
  const isPublicView = request.nextUrl.searchParams.get("wm") === "1";
  const isLightboxView =
    isPublicView && request.nextUrl.searchParams.get("display") === "lightbox";
  const skipWatermark =
    isCoverDisplay ||
    (!isPublicView && isOwner && (isManageContext || !isPublished));
  if (skipWatermark) {
    return serveCleanImage(r2Key, photoId, photo.filename, width);
  }

  const wmResponseHeaders = isPublicView ? PUBLIC_WM_CACHE_HEADERS : WATERMARK_CACHE_HEADERS;

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

  const wmKey = watermarkedKeyFromOriginal(r2Key, photoId, width, {
    variant: isLightboxView ? "lightbox" : isPublicView ? "view" : undefined,
    configKey,
  });

  const cached = await headObject(wmKey);
  if (cached) {
    const bytes = await getObjectBytes(wmKey);
    if (bytes) {
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/jpeg",
          ...wmResponseHeaders,
        },
      });
    }
  }

  // Cache miss: generate
  const original = await getObjectBytes(r2Key);
  if (!original) return NextResponse.json({ error: "Original not found" }, { status: 404 });

  const logoBuffer = await fetchWatermarkLogoBuffer(account?.watermark_logo_url);

  // Downscale for thumbnails before watermarking
  let srcBuffer = original;
  if (width) {
    const sharp = (await import("sharp")).default;
    srcBuffer = await sharp(original)
      .resize(width, undefined, { fit: "inside" })
      .toBuffer();
  }

  const watermarked = await applyWatermark(srcBuffer, wmConfig, logoBuffer);

  // Cache to R2 em background — não bloqueia a resposta.
  void putObjectBytes(wmKey, watermarked, "image/jpeg").catch(() => {});

  return new NextResponse(new Uint8Array(watermarked), {
    headers: {
      "Content-Type": "image/jpeg",
      ...wmResponseHeaders,
    },
  });
}
