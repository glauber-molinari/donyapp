import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "../site";
import { API_SCOPES, ALL_API_SCOPES } from "./scopes";

export function buildOpenApiDocument(baseUrl: string = siteUrl()) {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_NAME} Agent API`,
      version: "1.0.0",
      description:
        "Public read API for product catalog (no auth) plus scoped OAuth 2.0 endpoints for profile/account summaries. Does not expose private job, contact, or client PII beyond the authenticated user's own studio summary.",
      contact: { email: "suporte@donyapp.com", url: `${baseUrl}/contact` },
      license: { name: "Proprietary" },
    },
    servers: [{ url: baseUrl, description: "Production" }],
    tags: [
      { name: "Public", description: "Unauthenticated catalog endpoints" },
      { name: "Account", description: "OAuth-protected studio endpoints" },
      { name: "Discovery", description: "Machine-readable discovery documents" },
    ],
    paths: {
      "/api": {
        get: {
          tags: ["Discovery"],
          operationId: "getApiCatalog",
          summary: "Machine-readable API catalog index",
          security: [],
          responses: {
            "200": {
              description: "API catalog with Link relations and endpoint list",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/v1": {
        get: {
          tags: ["Discovery"],
          operationId: "getApiV1Index",
          summary: "v1 route list",
          security: [],
          responses: {
            "200": {
              description: "v1 routes",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/v1/health": {
        get: {
          tags: ["Public"],
          operationId: "getHealth",
          summary: "Service health",
          security: [],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Health" },
                },
              },
            },
          },
        },
      },
      "/api/v1/product": {
        get: {
          tags: ["Public"],
          operationId: "getProduct",
          summary: "Product identity and discovery links",
          security: [],
          responses: {
            "200": {
              description: "Product catalog entry",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
      "/api/v1/features": {
        get: {
          tags: ["Public"],
          operationId: "getFeatures",
          summary: "Feature areas and free-plan limits",
          security: [],
          responses: {
            "200": {
              description: "Features",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Features" },
                },
              },
            },
          },
        },
      },
      "/api/v1/pricing": {
        get: {
          tags: ["Public"],
          operationId: "getPricing",
          summary: "Public pricing summary (BRL)",
          security: [],
          responses: {
            "200": {
              description: "Pricing",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Pricing" },
                },
              },
            },
          },
        },
      },
      "/api/v1/me": {
        get: {
          tags: ["Account"],
          operationId: "getMe",
          summary: "Authenticated user profile summary",
          security: [{ oauth2: ["profile:read"] }],
          responses: {
            "200": {
              description: "Profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Profile" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
            "405": { $ref: "#/components/responses/MethodNotAllowed" },
          },
        },
      },
      "/api/v1/account": {
        get: {
          tags: ["Account"],
          operationId: "getAccount",
          summary: "Authenticated studio account summary",
          security: [{ oauth2: ["account:read"] }],
          responses: {
            "200": {
              description: "Account",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Account" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
            "405": { $ref: "#/components/responses/MethodNotAllowed" },
          },
        },
      },
      "/openapi.json": {
        get: {
          tags: ["Discovery"],
          operationId: "getOpenApi",
          summary: "This OpenAPI document",
          security: [],
          responses: { "200": { description: "OpenAPI 3.1 JSON" } },
        },
      },
      "/.well-known/oauth-authorization-server": {
        get: {
          tags: ["Discovery"],
          operationId: "getOAuthAuthorizationServer",
          summary: "RFC 8414 authorization server metadata",
          security: [],
          responses: { "200": { description: "AS metadata" } },
        },
      },
      "/.well-known/oauth-protected-resource": {
        get: {
          tags: ["Discovery"],
          operationId: "getOAuthProtectedResource",
          summary: "RFC 9728 protected resource metadata",
          security: [],
          responses: { "200": { description: "Protected resource metadata" } },
        },
      },
      "/.well-known/mcp.json": {
        get: {
          tags: ["Discovery"],
          operationId: "getMcpManifest",
          summary: "MCP server card / manifest",
          security: [],
          responses: { "200": { description: "MCP manifest" } },
        },
      },
      "/api/mcp": {
        post: {
          tags: ["Discovery"],
          operationId: "mcpStreamableHttp",
          summary: "MCP Streamable HTTP endpoint (JSON-RPC)",
          security: [],
          responses: { "200": { description: "JSON-RPC result" } },
        },
      },
    },
    components: {
      securitySchemes: {
        oauth2: {
          type: "oauth2",
          description: `OAuth 2.0 authorization code + PKCE (S256). Scopes: ${ALL_API_SCOPES.join(", ")}`,
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/oauth/authorize`,
              tokenUrl: `${baseUrl}/oauth/token`,
              refreshUrl: `${baseUrl}/oauth/token`,
              scopes: { ...API_SCOPES },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid Bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Forbidden: {
          description: "Token lacks required scope",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        MethodNotAllowed: {
          description: "HTTP method not allowed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        BadRequest: {
          description: "Malformed request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
      schemas: {
        Health: {
          type: "object",
          required: ["status", "service", "time"],
          properties: {
            status: { type: "string", enum: ["ok"] },
            service: { type: "string" },
            time: { type: "string", format: "date-time" },
          },
        },
        Product: { type: "object", additionalProperties: true },
        Features: { type: "object", additionalProperties: true },
        Pricing: { type: "object", additionalProperties: true },
        Profile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: ["string", "null"] },
            email: { type: ["string", "null"] },
            role: { type: "string" },
            accountId: { type: ["string", "null"], format: "uuid" },
          },
        },
        Account: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            plan: { type: ["string", "null"] },
            status: { type: ["string", "null"] },
          },
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message", "status"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                status: { type: "integer" },
                resolution: {
                  type: "string",
                  description: "How an agent should recover from this error",
                },
              },
            },
          },
        },
      },
    },
    "x-product": {
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      mcp: `${baseUrl}/api/mcp`,
      apiCatalog: `${baseUrl}/api`,
    },
  };
}
