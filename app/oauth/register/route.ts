import { NextResponse, type NextRequest } from "next/server";

import { getClient, registerPublicClient } from "@/lib/agent/api/oauth-store";

export const dynamic = "force-dynamic";

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** RFC 7591 dynamic client registration (public clients, auth method none). */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "JSON body required" },
      { status: 400 },
    );
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === "string" && isHttpUrl(u))
    : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: "redirect_uris must include at least one http(s) URI",
      },
      { status: 400 },
    );
  }

  const clientName =
    typeof body.client_name === "string" ? body.client_name.slice(0, 120) : undefined;

  try {
    const created = await registerPublicClient({
      clientName,
      redirectUris,
    });
    return NextResponse.json(
      {
        client_id: created.client_id,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: created.client_name,
        redirect_uris: created.redirect_uris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "registration_failed";
    return NextResponse.json(
      { error: "server_error", error_description: message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "invalid_client" }, { status: 404 });
    return NextResponse.json({
      client_id: client.client_id,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      token_endpoint_auth_method: client.token_endpoint_auth_method,
      grant_types: client.grant_types,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "server_error";
    return NextResponse.json(
      { error: "server_error", error_description: message },
      { status: 500 },
    );
  }
}
