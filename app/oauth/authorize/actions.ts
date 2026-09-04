"use server";

import { redirect } from "next/navigation";

import { createAuthorizationCode, getClient, isRedirectUriAllowed } from "@/lib/agent/api/oauth-store";
import { parseScopes, scopesToString } from "@/lib/agent/api/scopes";
import { createClient } from "@/lib/supabase/server";

export async function approveOAuthConsent(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const scope = String(formData.get("scope") ?? "");
  const state = String(formData.get("state") ?? "");
  const codeChallenge = String(formData.get("code_challenge") ?? "");
  const decision = String(formData.get("decision") ?? "deny");

  const fail = (error: string, description: string) => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", error);
    url.searchParams.set("error_description", description);
    if (state) url.searchParams.set("state", state);
    redirect(url.toString());
  };

  if (!clientId || !redirectUri || !codeChallenge) {
    redirect("/oauth/authorize?error=invalid_request");
  }

  if (decision !== "allow") {
    fail("access_denied", "The user denied the request");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = `/oauth/authorize?${new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const client = await getClient(clientId);
  if (!client || !isRedirectUriAllowed(client, redirectUri)) {
    fail("invalid_client", "Unknown client or redirect_uri");
  }

  const scopes = parseScopes(scope);
  const code = await createAuthorizationCode({
    clientId,
    userId: user.id,
    redirectUri,
    scopes,
    codeChallenge,
  });

  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  // unused but keeps scopes discoverable for clients that expect it
  void scopesToString(scopes);
  redirect(url.toString());
}
