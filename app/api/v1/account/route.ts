import type { NextRequest } from "next/server";

import {
  authenticateBearer,
  loadAccountSummary,
  loadUserSummary,
} from "@/lib/agent/api/bearer";
import { apiError, forbiddenScope, jsonOk, unauthorizedBearer } from "@/lib/agent/api/errors";
import { hasScope } from "@/lib/agent/api/scopes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = authenticateBearer(request);
  if (!auth) return unauthorizedBearer();
  if (!hasScope(auth.scopes, "account:read")) return forbiddenScope("account:read");

  const profile = await loadUserSummary(auth.userId);
  if (!profile?.accountId) return apiError(404, "not_found", "Account not found");

  const account = await loadAccountSummary(profile.accountId);
  if (!account) return apiError(404, "not_found", "Account not found");

  return jsonOk(account, { headers: { "Cache-Control": "no-store" } });
}
