/**
 * O domínio customizado da API (`auth.donyapp.com`) aponta para o projeto,
 * mas o certificado HTTPS quebra depois de pause/restore. URLs públicas de
 * Storage gravadas com esse host falham no <img> do browser.
 */
const BROKEN_API_HOSTS = new Set(["auth.donyapp.com"]);

const PROJECT_API_ORIGIN = "https://lakjtqcqnqblglhlxluj.supabase.co";

function workingApiOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (env) {
    try {
      const u = new URL(env);
      if (u.protocol === "https:" && !BROKEN_API_HOSTS.has(u.hostname)) {
        return u.origin;
      }
    } catch {
      /* ignore */
    }
  }
  return PROJECT_API_ORIGIN;
}

/** Reescreve URL pública do Storage quando o host customizado está sem TLS. */
export function rewritePublicStorageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  try {
    const parsed = new URL(raw);
    if (!BROKEN_API_HOSTS.has(parsed.hostname)) return raw;
    return `${workingApiOrigin()}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return raw;
  }
}
