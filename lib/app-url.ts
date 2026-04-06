import type { NextRequest } from "next/server";

/** Origem pública do app (OAuth redirect, links). Sem barra final. */
export function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return u ?? "";
}

/**
 * Origem pública para redirects em Route Handlers atrás de reverse proxy (Nginx).
 * Sem isso, `new URL(request.url).origin` vira http://127.0.0.1:3001 e o browser
 * recebe Location: http://localhost:3001/...
 */
export function publicAppOrigin(request: NextRequest): string {
  const fromEnv = appOrigin();
  if (fromEnv) return fromEnv;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export function googleCalendarOAuthRedirectUri(): string {
  const base = appOrigin();
  if (!base) return "";
  return `${base}/api/integrations/google/callback`;
}
