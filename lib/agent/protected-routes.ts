/**
 * App routes that require a session. Unknown paths must NOT be redirected to
 * /login (that creates soft-404s for agents and crawlers).
 */
const PROTECTED_EXACT = new Set([
  "/dashboard",
  "/board",
  "/contacts",
  "/agenda",
  "/settings",
  "/notes",
  "/tasks",
  "/reports",
  "/formularios",
  "/support",
  "/feedback",
  "/admin",
]);

const PROTECTED_PREFIXES = [
  "/dashboard/",
  "/board/",
  "/contacts/",
  "/agenda/",
  "/settings/",
  "/notes/",
  "/tasks/",
  "/reports/",
  "/formularios/",
  "/support/",
  "/feedback/",
  "/admin/",
] as const;

export function isProtectedAppPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  if (PROTECTED_EXACT.has(path)) return true;
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Public marketing / legal / agent discovery paths (HTML). */
export function isPublicContentPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
  if (path === "/") return true;

  const exact = new Set([
    "/about",
    "/contact",
    "/privacy",
    "/pricing",
    "/features",
    "/politica-de-privacidade",
    "/termos-de-servico",
    "/por-que-usar",
    "/blog",
    "/login",
    "/signup",
    "/forgot-password",
    "/llms.txt",
    "/sitemap.xml",
    "/robots.txt",
    "/manifest.webmanifest",
  ]);
  if (exact.has(path)) return true;

  return (
    path.startsWith("/blog/") ||
    path.startsWith("/auth/") ||
    path.startsWith("/invite") ||
    path.startsWith("/formulario/") ||
    path.startsWith("/p/") ||
    path.startsWith("/g/")
  );
}

/** Paths that have a Markdown representation via content negotiation. */
export function isMarkdownablePath(pathname: string): boolean {
  const path = (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
  if (path === "/") return true;
  const exact = new Set([
    "/about",
    "/contact",
    "/privacy",
    "/pricing",
    "/features",
    "/politica-de-privacidade",
    "/termos-de-servico",
    "/por-que-usar",
  ]);
  return exact.has(path);
}
