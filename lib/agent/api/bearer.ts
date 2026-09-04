import type { NextRequest } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

import { siteUrl } from "../site";
import {
  scopesFromClaim,
  verifyAccessToken,
  type AccessTokenClaims,
} from "./oauth-crypto";
import type { ApiScope } from "./scopes";

export type BearerAuth = {
  claims: AccessTokenClaims;
  scopes: ApiScope[];
  userId: string;
};

export function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() || null;
}

export function authenticateBearer(request: NextRequest): BearerAuth | null {
  const token = extractBearer(request);
  if (!token) return null;
  const base = siteUrl();
  const claims = verifyAccessToken(token, base, base);
  if (!claims) return null;
  return {
    claims,
    scopes: scopesFromClaim(claims.scope),
    userId: claims.sub,
  };
}

export async function loadUserSummary(userId: string): Promise<{
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  accountId: string | null;
} | null> {
  const db = createServiceRoleClient();
  if (!db) return null;
  const { data } = await db
    .from("users")
    .select("id, name, email, role, account_id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    accountId: data.account_id,
  };
}

export async function loadAccountSummary(accountId: string): Promise<{
  id: string;
  name: string;
  plan: string | null;
  status: string | null;
} | null> {
  const db = createServiceRoleClient();
  if (!db) return null;
  const [{ data: account }, { data: sub }] = await Promise.all([
    db.from("accounts").select("id, name").eq("id", accountId).maybeSingle(),
    db
      .from("subscriptions")
      .select("plan, status")
      .eq("account_id", accountId)
      .maybeSingle(),
  ]);
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    plan: sub?.plan ?? "free",
    status: sub?.status ?? null,
  };
}
