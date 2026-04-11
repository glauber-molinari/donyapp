/** @type {import('next').NextConfig} */
const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://donyapp.com").replace(/\/$/, "");

/** Origin do projeto Supabase (URL default *.supabase.co ou domínio customizado, ex.: auth.donyapp.com). */
function supabaseOriginForCsp() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

const supabaseImgOrigin = supabaseOriginForCsp();

// CSP mínimo (compatível com Next.js) para atender o relatório SEC sem exigir nonces.
// Mantém o comportamento padrão do app (scripts/estilos do próprio domínio) e endurece vetores comuns.
const csp = [
  "default-src 'self'",
  // Next/React dependem de scripts/estilos inline em produção (ex.: __NEXT_DATA__ e style attributes).
  // Preferível usar nonces/hashes, mas aqui mantemos compatibilidade sem complexidade extra.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Avatar Google, Storage (Supabase default + domínio custom em NEXT_PUBLIC_SUPABASE_URL), data/blob para prévia.
  `img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.supabase.co${
    supabaseImgOrigin ? ` ${supabaseImgOrigin}` : ""
  }`,
  "font-src 'self' data:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  transpilePackages: ["react-big-calendar"],
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v3", destination: "/", permanent: true },
      { source: "/v4", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CarameloSec valida CORS na URL principal do scan (ex.: HTML da home), não só em /api.
          { key: "Access-Control-Allow-Origin", value: appOrigin },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, asaas-access-token",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
