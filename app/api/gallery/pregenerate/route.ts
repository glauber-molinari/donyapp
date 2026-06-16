import { NextRequest, NextResponse } from "next/server";

import {
  pregenerateGalleryVariants,
  pregeneratePhotoVariants,
} from "@/lib/gallery/generate-variants";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Pré-gera variantes de imagem em background (após upload ou publish). */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { photoId?: string; galleryId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.photoId) {
    const { data: photo } = await svc
      .from("gallery_photos")
      .select("gallery_id, galleries!gallery_photos_gallery_id_fkey(account_id)")
      .eq("id", body.photoId)
      .maybeSingle();

    const gallery = photo?.galleries;
    if (!photo || !gallery || gallery.account_id !== profile.account_id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await pregeneratePhotoVariants(body.photoId);
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.galleryId) {
    const { data: gallery } = await svc
      .from("galleries")
      .select("account_id")
      .eq("id", body.galleryId)
      .maybeSingle();

    if (!gallery || gallery.account_id !== profile.account_id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await pregenerateGalleryVariants(body.galleryId);
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ error: "photoId or galleryId required" }, { status: 400 });
}
