/**
 * WebMCP catalog tools (imperative + declarative).
 * Prefer document.modelContext; navigator.modelContext is a trailing fallback.
 */

export type WebMcpCatalogTool = {
  name: string;
  description: string;
  path: string;
  annotations: {
    readOnlyHint: boolean;
    consequentialHint: boolean;
    untrustedContentHint: boolean;
  };
};

export const WEBMCP_CATALOG_TOOLS: WebMcpCatalogTool[] = [
  {
    name: "get_product",
    description:
      "Fetches Donyapp product identity, audience, and discovery links from GET /api/v1/product. Returns JSON with name, description, and links (OpenAPI, MCP, OAuth, marketing pages).",
    path: "/api/v1/product",
    annotations: {
      readOnlyHint: true,
      consequentialHint: false,
      untrustedContentHint: false,
    },
  },
  {
    name: "get_features",
    description:
      "Fetches Donyapp feature areas and Free plan limits from GET /api/v1/features. Returns JSON listing kanban, contacts, forms, agenda, team, and delivery.",
    path: "/api/v1/features",
    annotations: {
      readOnlyHint: true,
      consequentialHint: false,
      untrustedContentHint: false,
    },
  },
  {
    name: "get_pricing",
    description:
      "Fetches Free and Pro pricing in BRL cents from GET /api/v1/pricing. Returns monthly and yearly prices plus plan highlights.",
    path: "/api/v1/pricing",
    annotations: {
      readOnlyHint: true,
      consequentialHint: false,
      untrustedContentHint: false,
    },
  },
  {
    name: "get_health",
    description:
      "Checks that the Donyapp public Agent API is reachable via GET /api/v1/health. Returns { status: \"ok\", service, time }.",
    path: "/api/v1/health",
    annotations: {
      readOnlyHint: true,
      consequentialHint: false,
      untrustedContentHint: false,
    },
  },
];
