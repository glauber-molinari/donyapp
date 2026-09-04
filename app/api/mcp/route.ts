import { NextResponse, type NextRequest } from "next/server";

import { authenticateBearer } from "@/lib/agent/api/bearer";
import { handleMcpJsonRpc } from "@/lib/agent/api/mcp";
import { siteUrl } from "@/lib/agent/site";

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

export function GET() {
  // Streamable HTTP allows GET for SSE streams; we advertise JSON-only for now.
  return NextResponse.json(
    {
      error: "method_not_allowed",
      message:
        "Use POST with JSON-RPC (initialize, tools/list, tools/call). Manifest: /.well-known/mcp.json",
      mcp: `${siteUrl()}/api/mcp`,
    },
    { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS" } },
  );
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

export function DELETE() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
