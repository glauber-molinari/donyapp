import { NextRequest, NextResponse } from "next/server";

import { buildContentSecurityPolicy, generateCspNonce } from "@/lib/csp";
import { resolveCorsOrigin } from "@/lib/cors-origin";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const nonce = generateCspNonce();
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildContentSecurityPolicy(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const requestWithCsp = new NextRequest(request, {
    headers: requestHeaders,
  });

  const response = await updateSession(requestWithCsp);

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Access-Control-Allow-Origin", resolveCorsOrigin(request));
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, asaas-access-token",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
