import { NextRequest, NextResponse } from "next/server";

import {
  gallerySessionCookieName,
  hasGallerySession,
} from "@/lib/gallery/gallery-session";
import { presignDownload } from "@/lib/r2/operations";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,  // used for cookie check below
  { params }: { params: { slug: string; photoId: string } }
) {
  const svc = createServiceRoleClient();
  if (!svc) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: gallery } = await svc
    .from("galleries")
    .select("id, status, mode, download_enabled, expires_at, password_hash")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!gallery || gallery.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (gallery.password_hash) {
    const sessionCookie = request.cookies.get(gallerySessionCookieName(gallery.id));
    if (!hasGallerySession(gallery.id, sessionCookie?.value)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!gallery.download_enabled || gallery.mode !== "delivery") {
    return NextResponse.json({ error: "Download não disponível" }, { status: 403 });
  }
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expirada" }, { status: 410 });
  }

  const { data: photo } = await svc
    .from("gallery_photos")
    .select("r2_key, filename")
    .eq("id", params.photoId)
    .eq("gallery_id", gallery.id)
    .maybeSingle();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = await presignDownload(photo.r2_key, photo.filename);
  if (!url) return NextResponse.json({ error: "Storage não disponível" }, { status: 503 });

  return NextResponse.redirect(url);
}
