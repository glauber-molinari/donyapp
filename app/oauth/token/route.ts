import { NextResponse, type NextRequest } from "next/server";

import { signAccessToken } from "@/lib/agent/api/oauth-crypto";
import {
  consumeAuthorizationCode,
  consumeRefreshToken,
  getClient,
  isRedirectUriAllowed,
  issueRefreshToken,
} from "@/lib/agent/api/oauth-store";
import { verifyPkceS256 } from "@/lib/agent/api/oauth-crypto";
import { scopesToString } from "@/lib/agent/api/scopes";
import { siteUrl } from "@/lib/agent/site";

export const dynamic = "force-dynamic";

async function parseBody(request: NextRequest): Promise<URLSearchParams> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(json)) {
      if (v === undefined || v === null) continue;
      params.set(k, String(v));
    }
    return params;
  }
  const text = await request.text();
  return new URLSearchParams(text);
}

function tokenError(error: string, description: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  let params: URLSearchParams;
  try {
    params = await parseBody(request);
  } catch {
    return tokenError("invalid_request", "Unable to parse token request body");
  }

  const grantType = params.get("grant_type");
  const clientId = params.get("client_id")?.trim();
  if (!clientId) return tokenError("invalid_client", "client_id required", 401);

  let client;
  try {
    client = await getClient(clientId);
  } catch (e) {
    return tokenError(
      "server_error",
      e instanceof Error ? e.message : "OAuth store unavailable",
      500,
    );
  }
  if (!client) return tokenError("invalid_client", "Unknown client_id", 401);

  const base = siteUrl();

  if (grantType === "authorization_code") {
    const code = params.get("code")?.trim();
    const redirectUri = params.get("redirect_uri")?.trim();
    const codeVerifier = params.get("code_verifier")?.trim();
    if (!code || !redirectUri || !codeVerifier) {
      return tokenError(
        "invalid_request",
        "code, redirect_uri, and code_verifier are required",
      );
    }
    if (!isRedirectUriAllowed(client, redirectUri)) {
      return tokenError("invalid_grant", "redirect_uri mismatch");
    }

    const consumed = await consumeAuthorizationCode(code);
    if (!consumed || consumed.client_id !== clientId) {
      return tokenError("invalid_grant", "Invalid or expired authorization code");
    }
    if (consumed.redirect_uri !== redirectUri) {
      return tokenError("invalid_grant", "redirect_uri mismatch");
    }
    if (!verifyPkceS256(codeVerifier, consumed.code_challenge)) {
      return tokenError("invalid_grant", "PKCE verification failed");
    }

    const scope = scopesToString(consumed.scopes);
    const access = signAccessToken({
      iss: base,
      aud: base,
      sub: consumed.user_id,
      scope,
      client_id: clientId,
    });
    const refresh = await issueRefreshToken({
      clientId,
      userId: consumed.user_id,
      scopes: consumed.scopes,
    });

    return NextResponse.json(
      {
        access_token: access.token,
        token_type: "Bearer",
        expires_in: access.expiresIn,
        refresh_token: refresh,
        scope,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (grantType === "refresh_token") {
    const refreshToken = params.get("refresh_token")?.trim();
    if (!refreshToken) return tokenError("invalid_request", "refresh_token required");

    const row = await consumeRefreshToken(refreshToken);
    if (!row || row.client_id !== clientId) {
      return tokenError("invalid_grant", "Invalid refresh_token");
    }

    const scope = scopesToString(row.scopes);
    const access = signAccessToken({
      iss: base,
      aud: base,
      sub: row.user_id,
      scope,
      client_id: clientId,
    });
    const nextRefresh = await issueRefreshToken({
      clientId,
      userId: row.user_id,
      scopes: row.scopes,
    });

    return NextResponse.json(
      {
        access_token: access.token,
        token_type: "Bearer",
        expires_in: access.expiresIn,
        refresh_token: nextRefresh,
        scope,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return tokenError("unsupported_grant_type", "Supported: authorization_code, refresh_token");
}
