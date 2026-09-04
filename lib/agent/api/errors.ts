import { NextResponse } from "next/server";

import { siteUrl } from "../site";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    status: number;
    resolution?: string;
  };
};

const DEFAULT_RESOLUTIONS: Record<number, string> = {
  400: "Fix the request body or query parameters and retry.",
  401: "Obtain an OAuth access token (see /auth.md) and send Authorization: Bearer <token>.",
  403: "Request a token that includes the required scope, then retry.",
  404: "Check the path against /openapi.json or GET /api.",
  405: "Use an allowed HTTP method (see the Allow header).",
  500: "Retry shortly. If it persists, contact suporte@donyapp.com.",
};

export function apiError(
  status: number,
  code: string,
  message: string,
  options?: {
    headers?: HeadersInit;
    resolution?: string;
  },
): NextResponse<ApiErrorBody> {
  const resolution =
    options?.resolution ?? DEFAULT_RESOLUTIONS[status] ?? "See /openapi.json and /auth.md.";

  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
        resolution,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...options?.headers,
      },
    },
  );
}

export function unauthorizedBearer(message = "Bearer access token required") {
  const base = siteUrl();
  return apiError(401, "unauthorized", message, {
    headers: {
      "WWW-Authenticate": `Bearer realm="donyapp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
    },
    resolution:
      "Register a public OAuth client at POST /oauth/register, complete authorization code + PKCE, then send Authorization: Bearer <access_token>. See /auth.md.",
  });
}

export function forbiddenScope(scope: string) {
  return apiError(
    403,
    "insufficient_scope",
    `Token missing required scope: ${scope}`,
    {
      headers: {
        "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${scope}"`,
      },
      resolution: `Re-authorize with scope "${scope}" (and any others you need). Supported scopes are listed in /.well-known/oauth-protected-resource.`,
    },
  );
}

export function methodNotAllowed(allowed: string[]) {
  return apiError(405, "method_not_allowed", `Allowed methods: ${allowed.join(", ")}`, {
    headers: { Allow: allowed.join(", ") },
    resolution: `Retry with one of: ${allowed.join(", ")}. Catalog reads use GET; MCP uses POST.`,
  });
}

export function notFoundApi(pathHint?: string) {
  const base = siteUrl();
  return apiError(
    404,
    "not_found",
    pathHint ? `No API resource at ${pathHint}` : "API resource not found",
    {
      resolution: `List public routes via GET ${base}/api or the OpenAPI document at ${base}/openapi.json.`,
    },
  );
}

export function badRequest(message: string, resolution?: string) {
  return apiError(400, "bad_request", message, { resolution });
}

export function serverError(message = "Internal server error") {
  return apiError(500, "server_error", message);
}

export function jsonOk<T>(body: T, init?: { headers?: HeadersInit; status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      ...init?.headers,
    },
  });
}
