import { NextResponse } from "next/server";

/**
 * Optional redirect_uri target for local/agent OAuth smoke tests.
 * Real clients should use their own registered callback URL.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  return NextResponse.json({
    ok: !error,
    code: code ? "[received]" : null,
    error,
    state,
    hint: "Exchange code at POST /oauth/token with PKCE code_verifier.",
  });
}
