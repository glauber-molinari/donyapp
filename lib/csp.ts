function supabaseOrigins(): { https: string; wss: string } {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return { https: "", wss: "" };
  try {
    const u = new URL(raw);
    const https = u.origin;
    const wss = `wss://${u.host}`;
    return { https, wss };
  } catch {
    return { https: "", wss: "" };
  }
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const { https: supabaseHttps, wss: supabaseWss } = supabaseOrigins();

  const scriptExtra = isDev ? " 'unsafe-eval'" : "";

  const connectParts = ["'self'", "https://vitals.vercel-insights.com"];
  if (supabaseHttps) {
    connectParts.push(supabaseHttps);
    if (supabaseWss) connectParts.push(supabaseWss);
  }

  const imgParts = [
    "'self'",
    "blob:",
    "https://lh3.googleusercontent.com",
    "https://lh3.ggpht.com",
  ];
  if (supabaseHttps) imgParts.push(supabaseHttps);

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptExtra}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
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
