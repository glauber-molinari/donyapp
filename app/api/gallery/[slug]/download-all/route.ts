import archiver from "archiver";
import { NextRequest, NextResponse } from "next/server";
import { PassThrough, Readable } from "stream";

import { getObjectBytes } from "@/lib/r2/operations";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PHOTOS_ZIP = 200;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const svc = createServiceRoleClient();
  if (!svc) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { data: gallery } = await svc
    .from("galleries")
    .select("id, title, status, mode, download_enabled, expires_at, password_hash")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!gallery || gallery.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (gallery.password_hash) {
    const sessionCookie = request.cookies.get(`gallery-session-${gallery.id}`);
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!gallery.download_enabled || gallery.mode !== "delivery") {
    return NextResponse.json({ error: "Download não disponível" }, { status: 403 });
  }
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expirada" }, { status: 410 });
  }

  const { data: photos } = await svc
    .from("gallery_photos")
    .select("r2_key, filename")
    .eq("gallery_id", gallery.id)
    .order("display_order", { ascending: true })
    .limit(MAX_PHOTOS_ZIP);

  if (!photos?.length) {
    return NextResponse.json({ error: "Nenhuma foto" }, { status: 404 });
  }

  const pass = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 1 } });
  archive.pipe(pass);

  // Add photos to archive sequentially
  (async () => {
    for (const photo of photos) {
      const bytes = await getObjectBytes(photo.r2_key);
      if (bytes) {
        archive.append(bytes, { name: photo.filename });
      }
    }
    await archive.finalize();
  })().catch(() => archive.abort());

  const zipName = `${gallery.title.replace(/[^a-z0-9]/gi, "_")}.zip`;

  return new NextResponse(Readable.toWeb(pass) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(zipName)}"`,
      "Transfer-Encoding": "chunked",
    },
  });
}
