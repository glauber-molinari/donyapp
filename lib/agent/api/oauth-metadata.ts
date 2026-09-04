import { API_SCOPES, ALL_API_SCOPES } from "./scopes";
import { siteUrl } from "../site";

export function authorizationServerMetadata(baseUrl: string = siteUrl()) {
  const issuer = baseUrl;
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    scopes_supported: ALL_API_SCOPES,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${issuer}/auth.md`,
    ui_locales_supported: ["pt-BR", "en"],
  };
}

export function protectedResourceMetadata(baseUrl: string = siteUrl()) {
  return {
    resource: baseUrl,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ["header"],
    scopes_supported: ALL_API_SCOPES,
    resource_documentation: `${baseUrl}/auth.md`,
    resource_signing_alg_values_supported: ["HS256"],
    scopes_supported_descriptions: API_SCOPES,
  };
}

export function jsonDiscoveryHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    "Access-Control-Allow-Origin": "*",
  };
}
