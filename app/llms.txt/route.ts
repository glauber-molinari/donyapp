import { NextResponse } from "next/server";

import { llmsTxtBody } from "@/lib/agent/markdown-content";

export const dynamic = "force-dynamic";

export function GET() {
  return new NextResponse(llmsTxtBody(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
