import { NextResponse } from "next/server";

import { siteUrl } from "../site";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    status: number;
  };
};

export function apiError(
  status: number,
  code: string,
  message: string,
  extraHeaders?: HeadersInit,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, status } },
    { status, headers: extraHeaders },
  );
}

export function unauthorizedBearer(message = "Bearer access token required") {
  const base = siteUrl();
  return apiError(401, "unauthorized", message, {
    "WWW-Authenticate": `Bearer realm="donyapp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
  });
}

export function forbiddenScope(scope: string) {
  return apiError(
    403,
    "insufficient_scope",
    `Token missing required scope: ${scope}`,
    {
      "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${scope}"`,
    },
  );
}

export function jsonOk<T>(body: T, init?: { headers?: HeadersInit; status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      ...init?.headers,
    },
  });
}
