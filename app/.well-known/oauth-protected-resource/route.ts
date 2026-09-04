import { NextResponse } from "next/server";

import {
  jsonDiscoveryHeaders,
  protectedResourceMetadata,
} from "@/lib/agent/api/oauth-metadata";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(protectedResourceMetadata(), {
    headers: jsonDiscoveryHeaders(),
  });
}
