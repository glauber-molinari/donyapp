import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { ALL_API_SCOPES, type ApiScope } from "./scopes";

const ACCESS_TTL_SEC = 60 * 60; // 1h
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30d
const CODE_TTL_SEC = 60 * 10; // 10m

function signingSecret(): string {
  const explicit = process.env.OAUTH_SIGNING_SECRET?.trim();
  if (explicit) return explicit;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (service) return createHash("sha256").update(`donyapp-oauth:${service}`).digest("hex");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) return createHash("sha256").update(`donyapp-oauth-dev:${anon}`).digest("hex");
  return createHash("sha256").update("donyapp-oauth-insecure-dev").digest("hex");
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export type AccessTokenClaims = {
  iss: string;
  aud: string;
  sub: string;
  scope: string;
  client_id: string;
  iat: number;
  exp: number;
  jti: string;
};

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(): string {
  return b64url(randomBytes(32));
}

export function generateClientId(): string {
  return `dny_${b64url(randomBytes(16))}`;
}

export function sha256Base64Url(verifier: string): string {
  return b64url(createHash("sha256").update(verifier, "utf8").digest());
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const expected = sha256Base64Url(verifier);
  const a = Buffer.from(expected);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signAccessToken(claims: Omit<AccessTokenClaims, "iat" | "exp" | "jti"> & {
  ttlSec?: number;
}): { token: string; expiresIn: number; claims: AccessTokenClaims } {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = claims.ttlSec ?? ACCESS_TTL_SEC;
  const full: AccessTokenClaims = {
    iss: claims.iss,
    aud: claims.aud,
    sub: claims.sub,
    scope: claims.scope,
    client_id: claims.client_id,
    iat: now,
    exp: now + expiresIn,
    jti: b64url(randomBytes(12)),
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(full));
  const data = `${header}.${payload}`;
  const sig = b64url(createHmac("sha256", signingSecret()).update(data).digest());
  return { token: `${data}.${sig}`, expiresIn, claims: full };
}

export function verifyAccessToken(
  token: string,
  expectedIss: string,
  expectedAud: string,
): AccessTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const data = `${header}.${payload}`;
  const expected = b64url(createHmac("sha256", signingSecret()).update(data).digest());
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(fromB64url(payload).toString("utf8")) as AccessTokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== expectedIss) return null;
    if (claims.aud !== expectedAud) return null;
    if (typeof claims.exp !== "number" || claims.exp < now) return null;
    if (typeof claims.sub !== "string" || !claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}

export function scopesFromClaim(scope: string): ApiScope[] {
  const set = new Set(scope.split(/\s+/).filter(Boolean));
  return ALL_API_SCOPES.filter((s) => set.has(s));
}

export const OAUTH_TTL = {
  accessSec: ACCESS_TTL_SEC,
  refreshSec: REFRESH_TTL_SEC,
  codeSec: CODE_TTL_SEC,
} as const;
