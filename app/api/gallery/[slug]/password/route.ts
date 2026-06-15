import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  gallerySessionCookieName,
  signGallerySession,
} from "@/lib/gallery/gallery-session";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyPassword(input: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(input, salt, 32).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const svc = createServiceRoleClient();
  if (!svc) return NextResponse.json({ error: "Server error" }, { status: 500 });

  const { password } = (await request.json()) as { password?: string };
  if (!password) return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });

  const { data: gallery } = await svc
    .from("galleries")
    .select("id, password_hash")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (!gallery) return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 });
  if (!gallery.password_hash) return NextResponse.json({ ok: true });

  const valid = verifyPassword(password, gallery.password_hash);
  if (!valid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });

  const token = signGallerySession(gallery.id);
  if (!token) {
    return NextResponse.json({ error: "Sessão indisponível" }, { status: 500 });
  }

  const cookieName = gallerySessionCookieName(gallery.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/", // must be "/" so both /g/ page and /api/gallery/ routes receive the cookie
  });
  return res;
}
