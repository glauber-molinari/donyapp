/** Origem pública do app (OAuth redirect, links). Sem barra final. */
export function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return u ?? "";
}

export function googleCalendarOAuthRedirectUri(): string {
  const base = appOrigin();
  if (!base) return "";
  return `${base}/api/integrations/google/callback`;
}
