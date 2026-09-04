import { NextResponse } from "next/server";

import { SITE_NAME, siteUrl } from "@/lib/agent/site";
import { ALL_API_SCOPES, API_SCOPES } from "@/lib/agent/api/scopes";

export const dynamic = "force-dynamic";

export function GET() {
  const base = siteUrl();
  const scopeLines = ALL_API_SCOPES.map((s) => `- \`${s}\` — ${API_SCOPES[s]}`).join("\n");

  const body = `# Auth — ${SITE_NAME}

How agents authenticate to the ${SITE_NAME} Agent API.

## What needs no key

These endpoints are public (rate-limited by platform defaults):

- \`GET ${base}/api\` — API catalog index (machine-readable)
- \`GET ${base}/api/v1\` — v1 route list
- \`GET ${base}/api/v1/health\`
- \`GET ${base}/api/v1/product\`
- \`GET ${base}/api/v1/features\`
- \`GET ${base}/api/v1/pricing\`
- \`GET ${base}/openapi.json\` (alias: \`GET ${base}/api/openapi.json\`)
- \`GET ${base}/.well-known/mcp.json\`
- MCP tools \`get_product\`, \`get_features\`, \`get_pricing\`, \`get_health\` via \`POST ${base}/api/mcp\`
- MCP Apps UI resources under \`ui://donyapp/*.html\` via \`resources/list\` and \`resources/read\`
- WebMCP tools on the homepage (same catalog actions via \`document.modelContext\`)

Public responses never include customer jobs, contacts, or delivery links.

Errors on \`/api/*\` Agent routes return JSON:

\`\`\`json
{ "error": { "code": "unauthorized", "message": "…", "status": 401, "resolution": "…" } }
\`\`\`

## OAuth 2.0 (authorization code + PKCE S256)

1. Read authorization server metadata: [\`/.well-known/oauth-authorization-server\`](${base}/.well-known/oauth-authorization-server)
2. Read protected resource metadata (scopes): [\`/.well-known/oauth-protected-resource\`](${base}/.well-known/oauth-protected-resource)
3. Register a public client: \`POST ${base}/oauth/register\` with \`redirect_uris\`
4. Send the human to \`GET ${base}/oauth/authorize\` with \`response_type=code\`, \`client_id\`, \`redirect_uri\`, \`scope\`, \`state\`, \`code_challenge\`, \`code_challenge_method=S256\`
5. Exchange the code at \`POST ${base}/oauth/token\` (\`grant_type=authorization_code\` + \`code_verifier\`)
6. Call protected routes with \`Authorization: Bearer <access_token>\`

### Scopes

${scopeLines}

### Protected routes

- \`GET ${base}/api/v1/me\` — requires \`profile:read\`
- \`GET ${base}/api/v1/account\` — requires \`account:read\`
- MCP tools \`get_my_profile\` / \`get_my_account\` — same scopes

### Refresh

\`POST ${base}/oauth/token\` with \`grant_type=refresh_token\` and \`refresh_token\`.

## OpenAPI

Full schema: [${base}/openapi.json](${base}/openapi.json)

API catalog: [${base}/api](${base}/api)

## MCP

Manifest: [${base}/.well-known/mcp.json](${base}/.well-known/mcp.json)

Streamable HTTP: \`POST ${base}/api/mcp\`
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
