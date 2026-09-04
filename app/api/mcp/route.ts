import { NextResponse, type NextRequest } from "next/server";

import { authenticateBearer } from "@/lib/agent/api/bearer";
import { apiError, methodNotAllowed } from "@/lib/agent/api/errors";
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
  return apiError(
    405,
    "method_not_allowed",
    "Use POST with JSON-RPC (initialize, tools/list, tools/call, resources/list, resources/read). Manifest: /.well-known/mcp.json",
    {
      headers: { ...corsHeaders, Allow: "POST, OPTIONS, DELETE" },
      resolution: `POST JSON-RPC to ${siteUrl()}/api/mcp. Discovery: ${siteUrl()}/.well-known/mcp.json`,
    },
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
        error: {
          code: -32700,
          message: "Parse error",
          data: {
            resolution: "Send a JSON-RPC 2.0 object with Content-Type: application/json.",
          },
        },
      },
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  try {
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
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: { detail, resolution: "Retry shortly or contact suporte@donyapp.com." },
        },
      },
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}

export function PUT() {
  return methodNotAllowed(["POST", "OPTIONS", "DELETE"]);
}

export function PATCH() {
  return methodNotAllowed(["POST", "OPTIONS", "DELETE"]);
}

export function DELETE() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
