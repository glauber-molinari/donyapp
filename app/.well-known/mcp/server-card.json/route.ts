import { NextResponse } from "next/server";

import { mcpServerCard } from "@/lib/agent/api/mcp";
import { jsonDiscoveryHeaders } from "@/lib/agent/api/oauth-metadata";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(mcpServerCard(), {
    headers: jsonDiscoveryHeaders(),
  });
}
