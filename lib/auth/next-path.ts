/** Caminho interno seguro para redirecionamento pós-login (evita open redirect). */
export function normalizeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}

export function inviteTokenFromNext(next: string): string | null {
  const match = /^\/invite\/([^/?#]+)/.exec(next);
  return match?.[1] ?? null;
}
