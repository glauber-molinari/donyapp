import { NextRequest, NextResponse } from "next/server";

import { isGalleryOwner, imageContentTypeFromFilename } from "@/lib/gallery/gallery-access";
import { applyWatermark } from "@/lib/gallery/watermark";
import {
  gallerySessionCookieName,
  hasGallerySession,
} from "@/lib/gallery/gallery-session";
import { getObjectBytes, headObject, putObjectBytes } from "@/lib/r2/operations";
import { watermarkedKeyFromOriginal } from "@/lib/r2/keys";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WatermarkConfig } from "@/types/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    .select("mode, status, expires_at, watermark_config, account_id, password_hash")
    .eq("id", photo.gallery_id)
    .maybeSingle();

  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPublished = gallery.status === "published";
  const ownerPreview = !isPublished && (await isGalleryOwner(gallery.account_id));

  if (!isPublished && !ownerPreview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Público publicado: senha e expiração
  if (isPublished) {
    if (gallery.password_hash) {
      const cookieName = gallerySessionCookieName(photo.gallery_id);
      const sessionCookie = request.cookies.get(cookieName);
      if (!hasGallerySession(photo.gallery_id, sessionCookie?.value)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: "Gallery expired" }, { status: 410 });
    }
  }

  const r2Key = photo.r2_key;
  const originalContentType = imageContentTypeFromFilename(photo.filename);

  // DELIVERY mode: serve original
  if (gallery.mode === "delivery") {
    const bytes = await getObjectBytes(r2Key);
    if (!bytes) return NextResponse.json({ error: "Not in storage" }, { status: 404 });
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": originalContentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  // SELECTION mode: watermarked
  const wmKey = watermarkedKeyFromOriginal(r2Key, photoId, width);

  // Cache hit
  const cached = await headObject(wmKey);
  if (cached) {
    const bytes = await getObjectBytes(wmKey);
    if (bytes) {
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, immutable, max-age=86400",
        },
      });
    }
  }

  // Cache miss: generate
  const original = await getObjectBytes(r2Key);
  if (!original) return NextResponse.json({ error: "Original not found" }, { status: 404 });

  // Fetch account watermark config
  const { data: account } = await svc
    .from("accounts")
    .select("watermark_config, watermark_logo_url, name")
    .eq("id", gallery.account_id)
    .maybeSingle();

  const galleryWm = gallery.watermark_config as WatermarkConfig | null;
  const accountWm = (account?.watermark_config ?? null) as WatermarkConfig | null;
  const wmConfig: WatermarkConfig = galleryWm ?? accountWm ?? {
    type: "text",
    text: `© ${account?.name ?? "Studio"}`,
    opacity: 40,
    scale: 20,
    rotation: -30,
  };
  if (!wmConfig.text) {
    wmConfig.text = `© ${account?.name ?? "Studio"}`;
  }

  // Logo buffer — only fetch from trusted Supabase storage domain to prevent SSRF
  let logoBuffer: Buffer | null = null;
  if (account?.watermark_logo_url) {
    try {
      const logoUrl = new URL(account.watermark_logo_url);
      const isTrustedStorage =
        (logoUrl.protocol === "https:" &&
          (logoUrl.hostname.endsWith(".supabase.co") ||
            logoUrl.hostname.endsWith(".supabase.in"))) ||
        (process.env.NEXT_PUBLIC_SUPABASE_URL
          ? logoUrl.hostname === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : false);
      if (isTrustedStorage) {
        const res = await fetch(account.watermark_logo_url, { redirect: "error" });
        if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer());
      }
    } catch {
      // fallback to text watermark
    }
  }

  // Downscale for thumbnails before watermarking
  let srcBuffer = original;
  if (width) {
    const sharp = (await import("sharp")).default;
    srcBuffer = await sharp(original)
      .resize(width, undefined, { fit: "inside" })
      .toBuffer();
  }

  const watermarked = await applyWatermark(srcBuffer, wmConfig, logoBuffer);

  // Cache to R2 (best-effort, don't fail if R2 unavailable)
  await putObjectBytes(wmKey, watermarked, "image/jpeg").catch(() => {});

  return new NextResponse(new Uint8Array(watermarked), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, immutable, max-age=86400",
    },
  });
}
