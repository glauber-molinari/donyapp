import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildGallerySelectionHtml } from "@/lib/email/gallery-selection-html";
import { getResendFrom } from "@/lib/email/resend-from";
import {
  gallerySessionCookieName,
  hasGallerySession,
} from "@/lib/gallery/gallery-session";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const svc = createServiceRoleClient();
  if (!svc) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const body = (await request.json()) as {
    selected_photo_ids?: string[];
    client_note?: string;
  };

  if (!Array.isArray(body.selected_photo_ids) || body.selected_photo_ids.length === 0) {
    return NextResponse.json({ error: "Nenhuma foto selecionada" }, { status: 400 });
  }

  // Validate all IDs are UUID-shaped before querying
  const candidateIds = body.selected_photo_ids.filter((id) => UUID_RE.test(id));
  if (candidateIds.length === 0) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  }

  const { data: gallery } = await svc
    .from("galleries")
    .select("id, title, status, expires_at, mode, account_id, password_hash")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!gallery || gallery.status !== "published") {
    return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
  }

  // Password gate
  if (gallery.password_hash) {
    const sessionCookie = request.cookies.get(gallerySessionCookieName(gallery.id));
    if (!hasGallerySession(gallery.id, sessionCookie?.value)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return NextResponse.json({ error: "Galeria expirada" }, { status: 410 });
  }

  // Validate that every submitted photo ID actually belongs to this gallery
  const { data: validPhotos } = await svc
    .from("gallery_photos")
    .select("id")
    .eq("gallery_id", gallery.id)
    .in("id", candidateIds);

  const validIds = (validPhotos ?? []).map((p) => p.id);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "Nenhuma foto válida" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  await svc.from("gallery_selections").insert({
    gallery_id: gallery.id,
    selected_photo_ids: validIds,
    client_note: body.client_note ?? null,
    ip_hash: ipHash,
  });

  // Notify photographer via email
  const { data: ownerUser } = await svc
    .from("users")
    .select("email")
    .eq("account_id", gallery.account_id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://donyapp.com";
  const apiKey = process.env.RESEND_API_KEY;
  const from = getResendFrom();

  if (apiKey && from && ownerUser?.email) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: [ownerUser.email],
        subject: `Seleção recebida: ${gallery.title}`,
        html: buildGallerySelectionHtml({
          galleryTitle: gallery.title,
          photoCount: validIds.length,
          clientNote: body.client_note ?? null,
          galleryUrl: `${appUrl}/galerias/${gallery.id}`,
        }),
        text: `Seu cliente selecionou ${validIds.length} fotos da galeria "${gallery.title}". Ver em: ${appUrl}/galerias/${gallery.id}`,
      });
    } catch {
      // Email falhou, mas a seleção foi salva — não retornar erro
    }
  }

  return NextResponse.json({ ok: true });
}
