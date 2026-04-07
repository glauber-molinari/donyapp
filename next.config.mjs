/** @type {import('next').NextConfig} */
const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://donyapp.com").replace(/\/$/, "");

// CSP mínimo (compatível com Next.js) para atender o relatório SEC sem exigir nonces.
// Mantém o comportamento padrão do app (scripts/estilos do próprio domínio) e endurece vetores comuns.
const csp = [
  "default-src 'self'",
  // Next/React dependem de scripts/estilos inline em produção (ex.: __NEXT_DATA__ e style attributes).
  // Preferível usar nonces/hashes, mas aqui mantemos compatibilidade sem complexidade extra.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Avatar do Google (OAuth) e data URIs (ex.: placeholders, favicons embutidos).
  "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
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
