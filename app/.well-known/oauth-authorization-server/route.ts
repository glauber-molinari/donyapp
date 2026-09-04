import { NextResponse } from "next/server";

import {
  authorizationServerMetadata,
  jsonDiscoveryHeaders,
} from "@/lib/agent/api/oauth-metadata";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(authorizationServerMetadata(), {
    headers: jsonDiscoveryHeaders(),
  });
}
