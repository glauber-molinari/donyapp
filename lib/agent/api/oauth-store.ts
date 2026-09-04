import { createServiceRoleClient } from "@/lib/supabase/service-role";

import {
  generateClientId,
  generateOpaqueToken,
  hashOpaqueToken,
  OAUTH_TTL,
} from "./oauth-crypto";

export type OAuthClientRow = {
  client_id: string;
  client_secret_hash: string | null;
  client_name: string | null;
  redirect_uris: string[];
  grant_types: string[];
  token_endpoint_auth_method: string;
};

function db() {
  const client = createServiceRoleClient();
  if (!client) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY required for OAuth persistence");
  }
  return client;
}

export async function registerPublicClient(input: {
  clientName?: string;
  redirectUris: string[];
}): Promise<{ client_id: string; client_name: string | null; redirect_uris: string[] }> {
  const clientId = generateClientId();
  const supabase = db();
  const { error } = await supabase.from("oauth_clients" as never).insert({
    client_id: clientId,
    client_secret_hash: null,
    client_name: input.clientName ?? null,
    redirect_uris: input.redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    token_endpoint_auth_method: "none",
  } as never);

  if (error) throw new Error(error.message);
  return {
    client_id: clientId,
    client_name: input.clientName ?? null,
    redirect_uris: input.redirectUris,
  };
}

export async function getClient(clientId: string): Promise<OAuthClientRow | null> {
  const supabase = db();
  const { data, error } = await supabase
    .from("oauth_clients" as never)
    .select(
      "client_id, client_secret_hash, client_name, redirect_uris, grant_types, token_endpoint_auth_method",
    )
    .eq("client_id", clientId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as OAuthClientRow;
}

export async function createAuthorizationCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
}): Promise<string> {
  const code = generateOpaqueToken();
  const supabase = db();
  const expiresAt = new Date(Date.now() + OAUTH_TTL.codeSec * 1000).toISOString();
  const { error } = await supabase.from("oauth_authorization_codes" as never).insert({
    code_hash: hashOpaqueToken(code),
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    scopes: input.scopes,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
    expires_at: expiresAt,
  } as never);
  if (error) throw new Error(error.message);
  return code;
}

export async function consumeAuthorizationCode(code: string): Promise<{
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scopes: string[];
  code_challenge: string;
} | null> {
  const supabase = db();
  const codeHash = hashOpaqueToken(code);
  const { data, error } = await supabase
    .from("oauth_authorization_codes" as never)
    .select("id, client_id, user_id, redirect_uri, scopes, code_challenge, expires_at, used_at")
    .eq("code_hash", codeHash)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    client_id: string;
    user_id: string;
    redirect_uri: string;
    scopes: string[];
    code_challenge: string;
    expires_at: string;
    used_at: string | null;
  };
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  const { error: updErr } = await supabase
    .from("oauth_authorization_codes" as never)
    .update({ used_at: new Date().toISOString() } as never)
    .eq("id", row.id)
    .is("used_at", null);
  if (updErr) return null;

  return {
    client_id: row.client_id,
    user_id: row.user_id,
    redirect_uri: row.redirect_uri,
    scopes: row.scopes,
    code_challenge: row.code_challenge,
  };
}

export async function issueRefreshToken(input: {
  clientId: string;
  userId: string;
  scopes: string[];
}): Promise<string> {
  const token = generateOpaqueToken();
  const supabase = db();
  const expiresAt = new Date(Date.now() + OAUTH_TTL.refreshSec * 1000).toISOString();
  const { error } = await supabase.from("oauth_refresh_tokens" as never).insert({
    token_hash: hashOpaqueToken(token),
    client_id: input.clientId,
    user_id: input.userId,
    scopes: input.scopes,
    expires_at: expiresAt,
  } as never);
  if (error) throw new Error(error.message);
  return token;
}

export async function consumeRefreshToken(token: string): Promise<{
  client_id: string;
  user_id: string;
  scopes: string[];
} | null> {
  const supabase = db();
  const tokenHash = hashOpaqueToken(token);
  const { data, error } = await supabase
    .from("oauth_refresh_tokens" as never)
    .select("id, client_id, user_id, scopes, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    client_id: string;
    user_id: string;
    scopes: string[];
    expires_at: string;
    revoked_at: string | null;
  };
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  await supabase
    .from("oauth_refresh_tokens" as never)
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq("id", row.id);

  return {
    client_id: row.client_id,
    user_id: row.user_id,
    scopes: row.scopes,
  };
}

export function isRedirectUriAllowed(client: OAuthClientRow, redirectUri: string): boolean {
  return client.redirect_uris.includes(redirectUri);
}
