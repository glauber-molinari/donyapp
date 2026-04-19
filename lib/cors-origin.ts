import type { NextRequest } from "next/server";

/** Origens permitidas para Access-Control-Allow-Origin (alinhado ao host da requisição / env). */
export function resolveCorsOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  const vercelPreview =
    process.env.VERCEL_URL && !process.env.VERCEL_URL.startsWith("http")
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VERCEL_URL?.replace(/\/$/, "");

  const allowed = new Set<string>([
    "https://www.donyapp.com",
    "https://donyapp.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  if (fromEnv) allowed.add(fromEnv);
  if (vercelPreview) allowed.add(vercelPreview);

  const origin = request.nextUrl.origin;
  if (allowed.has(origin)) return origin;

  return fromEnv ?? "https://www.donyapp.com";
}
