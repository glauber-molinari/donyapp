import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/lib/agent/api/openapi";

export const dynamic = "force-dynamic";

/** Alias used by some scanners (`/api/openapi.json`). */
export function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
