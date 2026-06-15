import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type GallerySessionPayload = {
  galleryId: string;
  exp: number;
};

function sessionSecret(): string | null {
  const candidates = [
    process.env.GALLERY_SESSION_SECRET,
    process.env.GOOGLE_CALENDAR_OAUTH_STATE_SECRET,
    process.env.CRON_SECRET,
  ];
  for (const raw of candidates) {
    const s = raw?.trim();
    if (s && s.length >= 16) return s;
  }
  return null;
}

export function gallerySessionCookieName(galleryId: string): string {
  return `gallery-session-${galleryId}`;
}

export function signGallerySession(galleryId: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const payload: GallerySessionPayload = {
    galleryId,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyGallerySession(galleryId: string, token: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;

  try {
    if (!timingSafeEqual(sigBuf, expBuf)) return false;
  } catch {
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  if (typeof parsed !== "object" || parsed === null) return false;
  const o = parsed as Record<string, unknown>;
  if (typeof o.galleryId !== "string" || typeof o.exp !== "number") return false;
  if (o.galleryId !== galleryId) return false;
  if (o.exp < Date.now()) return false;
  return true;
}

export function hasGallerySession(galleryId: string, cookieValue: string | undefined): boolean {
  return verifyGallerySession(galleryId, cookieValue);
}
