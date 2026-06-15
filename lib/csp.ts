/**
 * Origens HTTPS extras para CSP (connect-src / img-src) quando a API Supabase
 * usa domínio próprio. Separe por vírgula ou espaço.
 * Ex.: https://auth.seudominio.com
 */
const ENV_SUPABASE_CSP_EXTRA = "NEXT_PUBLIC_SUPABASE_CSP_ORIGINS";

/** API Supabase em produção (custom domain). Incluída na CSP para não bloquear fetch/imagens se o middleware não enxergar a mesma URL que o bundle do cliente. */
const DONYAPP_SUPABASE_API_HTTPS = "https://auth.donyapp.com";

function parseHttpsOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

function splitOriginsList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Origens do projeto Supabase para diretivas CSP (REST, Realtime, Storage em <img>).
 */
function collectSupabaseCspOrigins(): { httpsOrigins: string[]; wssOrigins: string[] } {
  const httpsSet = new Set<string>();
  const wssSet = new Set<string>();

  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    ...splitOriginsList(process.env[ENV_SUPABASE_CSP_EXTRA]),
    DONYAPP_SUPABASE_API_HTTPS,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  for (const raw of candidates) {
    const https = parseHttpsOrigin(raw);
    if (!https) continue;
    httpsSet.add(https);
    try {
      wssSet.add(`wss://${new URL(https).host}`);
    } catch {
      /* ignore */
    }
  }

  return {
    httpsOrigins: Array.from(httpsSet),
    wssOrigins: Array.from(wssSet),
  };
}

/**
 * O JS do Supabase ainda pode usar hosts `*.supabase.co` (Realtime/ws, Storage, etc.)
 * mesmo com `NEXT_PUBLIC_SUPABASE_URL` apontando para domínio customizado — sem isso
 * o Chrome mantém "violates Content Security Policy" em connect-src.
 */
const SUPABASE_PLATFORM_HTTPS = "https://*.supabase.co";
const SUPABASE_PLATFORM_WSS = "wss://*.supabase.co";

/** Upload direto (presigned PUT) das galerias: browser → R2. */
const R2_STORAGE_HTTPS = "https://*.r2.cloudflarestorage.com";

function collectR2CspOrigin(): string | null {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
  if (!endpoint) return null;
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const { httpsOrigins, wssOrigins } = collectSupabaseCspOrigins();

  const scriptExtra = isDev ? " 'unsafe-eval'" : "";

  const connectParts = [
    "'self'",
    "https://vitals.vercel-insights.com",
    SUPABASE_PLATFORM_HTTPS,
    SUPABASE_PLATFORM_WSS,
    R2_STORAGE_HTTPS,
  ];
  const r2Origin = collectR2CspOrigin();
  if (r2Origin) connectParts.push(r2Origin);
  for (const o of httpsOrigins) {
    connectParts.push(o);
  }
  for (const w of wssOrigins) {
    connectParts.push(w);
  }

  const imgParts = [
    "'self'",
    "blob:",
    /** Google usa vários hosts (lh3, lh4, …); listar só lh3 quebra foto de perfil OAuth. */
    "https://*.googleusercontent.com",
    "https://*.ggpht.com",
    /** Avatares / fotos em buckets no projeto `*.supabase.co`. */
    SUPABASE_PLATFORM_HTTPS,
  ];
  for (const o of httpsOrigins) {
    imgParts.push(o);
  }

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptExtra}`,
    /** Sem nonce: com nonce + 'unsafe-inline' o Chrome ignora unsafe-inline e bloqueia style="" (React, libs). */
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgParts.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connectParts.join(" ")}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "frame-src 'self'",
  ];

  return directives.join("; ");
}

export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
