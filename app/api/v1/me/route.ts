import type { NextRequest } from "next/server";

import { authenticateBearer, loadUserSummary } from "@/lib/agent/api/bearer";
import {
  apiError,
  forbiddenScope,
  jsonOk,
  methodNotAllowed,
  unauthorizedBearer,
} from "@/lib/agent/api/errors";
import { hasScope } from "@/lib/agent/api/scopes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authenticateBearer(request);
  if (!auth) return unauthorizedBearer();
  if (!hasScope(auth.scopes, "profile:read")) return forbiddenScope("profile:read");

  const profile = await loadUserSummary(auth.userId);
  if (!profile) return apiError(404, "not_found", "Profile not found");

  return jsonOk(profile, { headers: { "Cache-Control": "no-store" } });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    },
  });
}

export function POST() {
  return methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
}

export function PUT() {
  return methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
}

export function PATCH() {
  return methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
}

export function DELETE() {
  return methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
}
