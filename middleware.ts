import { NextRequest, NextResponse } from "next/server";

import {
  appendVary,
  markdownResponseHeaders,
  preferredType,
} from "@/lib/agent/accept";
import { notFoundMarkdown } from "@/lib/agent/markdown-content";
import {
  isMarkdownablePath,
  isProtectedAppPath,
  isPublicContentPath,
} from "@/lib/agent/protected-routes";
import { buildContentSecurityPolicy, generateCspNonce } from "@/lib/csp";
import { resolveCorsOrigin } from "@/lib/cors-origin";
import { updateSession } from "@/lib/supabase/middleware";

function stripMdExtension(pathname: string): string {
  if (pathname.endsWith(".md")) {
    const base = pathname.slice(0, -3);
    return base === "" ? "/" : base;
  }
  return pathname;
}

function markdownApiPath(contentPath: string): string {
  if (contentPath === "/") return "/api/markdown";
  return `/api/markdown${contentPath}`;
}

function negotiateMarkdown(request: NextRequest): NextResponse | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const pathname = request.nextUrl.pathname;

  // Agent discovery documents served by dedicated route handlers (not Markdown mirrors).
  if (
    pathname === "/auth.md" ||
    pathname === "/openapi.json" ||
    pathname.startsWith("/.well-known/")
  ) {
    return null;
  }

  // Never negotiate away from API, Next internals, or auth callbacks.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/oauth/")
  ) {
    return null;
  }

  const explicitMd = pathname.endsWith(".md");
  const contentPath = stripMdExtension(pathname);
  const accept = request.headers.get("accept");
  const chosen = preferredType(accept);
  const wantsMarkdown = explicitMd || chosen === "text/markdown";

  if (!wantsMarkdown) {
    if (chosen === null && accept) {
      return new NextResponse(
        "Not Acceptable\n\nAvailable: text/html, text/markdown\n",
        {
          status: 406,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            Vary: "Accept, Accept-Encoding",
          },
        },
      );
    }
    return null;
  }

  if (isMarkdownablePath(contentPath)) {
    const url = request.nextUrl.clone();
    url.pathname = markdownApiPath(contentPath);
    const rewritten = NextResponse.rewrite(url);
    appendVary(rewritten.headers);
    return rewritten;
  }

  // Existing HTML-only routes: fall through (do not fake a Markdown 404).
  if (
    isProtectedAppPath(contentPath) ||
    isPublicContentPath(contentPath) ||
    contentPath.startsWith("/api/") ||
    (process.env.NODE_ENV === "development" &&
      contentPath.startsWith("/dev-mobile-preview"))
  ) {
    return null;
  }

  // Truly unknown path + Markdown preferred → HTTP 404 with recovery links.
  return new NextResponse(notFoundMarkdown(contentPath), {
    status: 404,
    headers: markdownResponseHeaders(),
  });
}

export async function middleware(request: NextRequest) {
  const markdown = negotiateMarkdown(request);
  if (markdown) return markdown;

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
    "Content-Type, Authorization, asaas-access-token, MCP-Session-Id, Mcp-Session-Id",
  );

  // Public HTML pages that also offer Markdown must vary on Accept.
  const path = request.nextUrl.pathname;
  if (isMarkdownablePath(path) || path === "/") {
    appendVary(response.headers);
  }

  // RFC 8288 discovery hints for agents (OpenAPI, MCP, OAuth, llms.txt).
  if (
    path === "/" ||
    path === "/llms.txt" ||
    path.startsWith("/api/v1/") ||
    path === "/openapi.json" ||
    path.startsWith("/.well-known/")
  ) {
    const origin = request.nextUrl.origin;
    response.headers.append(
      "Link",
      `<${origin}/openapi.json>; rel="service-desc"; type="application/openapi+json"`,
    );
    response.headers.append(
      "Link",
      `<${origin}/.well-known/mcp.json>; rel="mcp"; type="application/json"`,
    );
    response.headers.append(
      "Link",
      `<${origin}/.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
    );
    response.headers.append(
      "Link",
      `<${origin}/llms.txt>; rel="describedby"; type="text/plain"`,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
