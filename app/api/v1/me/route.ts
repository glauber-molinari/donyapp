import type { NextRequest } from "next/server";

import { authenticateBearer, loadUserSummary } from "@/lib/agent/api/bearer";
import { apiError, forbiddenScope, jsonOk, unauthorizedBearer } from "@/lib/agent/api/errors";
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
