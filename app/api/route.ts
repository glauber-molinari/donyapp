import { jsonOk } from "@/lib/agent/api/errors";
import { siteUrl } from "@/lib/agent/site";

export const dynamic = "force-dynamic";

/**
 * Machine-readable API catalog index (RFC 8631-style discovery entrypoint).
 * Public catalog only — no private studio data.
 */
export function GET() {
  const base = siteUrl();
  return jsonOk({
    name: "Donyapp Agent API",
    description:
      "Public catalog endpoints plus OAuth-scoped profile/account summaries. See OpenAPI for the full contract.",
    documentation: `${base}/auth.md`,
    openapi: `${base}/openapi.json`,
    openapiAlias: `${base}/api/openapi.json`,
    llmsTxt: `${base}/llms.txt`,
    mcp: {
      manifest: `${base}/.well-known/mcp.json`,
      serverCard: `${base}/.well-known/mcp/server-card.json`,
      streamableHttp: `${base}/api/mcp`,
    },
    oauth: {
      authorizationServer: `${base}/.well-known/oauth-authorization-server`,
      protectedResource: `${base}/.well-known/oauth-protected-resource`,
      register: `${base}/oauth/register`,
      authorize: `${base}/oauth/authorize`,
      token: `${base}/oauth/token`,
    },
    links: [
      { rel: "service-desc", href: `${base}/openapi.json`, type: "application/openapi+json" },
      { rel: "service-doc", href: `${base}/auth.md`, type: "text/markdown" },
      { rel: "describedby", href: `${base}/llms.txt`, type: "text/plain" },
      { rel: "mcp", href: `${base}/.well-known/mcp.json`, type: "application/json" },
    ],
    endpoints: {
      public: [
        { method: "GET", path: "/api/v1/health", auth: false },
        { method: "GET", path: "/api/v1/product", auth: false },
        { method: "GET", path: "/api/v1/features", auth: false },
        { method: "GET", path: "/api/v1/pricing", auth: false },
      ],
      protected: [
        { method: "GET", path: "/api/v1/me", auth: true, scope: "profile:read" },
        { method: "GET", path: "/api/v1/account", auth: true, scope: "account:read" },
      ],
    },
  });
}
