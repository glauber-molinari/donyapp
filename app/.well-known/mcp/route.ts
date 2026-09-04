import { NextResponse, type NextRequest } from "next/server";

import { authenticateBearer } from "@/lib/agent/api/bearer";
import { handleMcpJsonRpc } from "@/lib/agent/api/mcp";
import { mcpManifest } from "@/lib/agent/api/mcp";
import { jsonDiscoveryHeaders } from "@/lib/agent/api/oauth-metadata";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, MCP-Session-Id, Mcp-Session-Id, Last-Event-ID, Mcp-Method, Mcp-Name",
  "Access-Control-Expose-Headers": "MCP-Session-Id, Mcp-Session-Id",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** Some scanners probe `/.well-known/mcp` as the MCP entrypoint/manifest. */
export function GET() {
  return NextResponse.json(mcpManifest(), {
    headers: { ...jsonDiscoveryHeaders(), ...corsHeaders },
  });
}

export async function POST(request: NextRequest) {
  const auth = authenticateBearer(request);
  let message: Record<string, unknown>;
  try {
    message = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const result = await handleMcpJsonRpc(message, auth);
  if ("notification" in result) {
    return new NextResponse(null, { status: 202, headers: corsHeaders });
  }

  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (result.sessionId) {
    headers.set("MCP-Session-Id", result.sessionId);
    headers.set("Mcp-Session-Id", result.sessionId);
  }

  return NextResponse.json(result.body, { status: 200, headers });
}
