import {
  loadAccountSummary,
  loadUserSummary,
  type BearerAuth,
} from "./bearer";
import {
  publicFeatures,
  publicHealth,
  publicPricing,
  publicProduct,
} from "./catalog";
import { hasScope } from "./scopes";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "../site";

export const MCP_PROTOCOL_VERSION = "2025-03-26";
export const MCP_SERVER_VERSION = "1.0.0";

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
};

export function mcpTools(): McpTool[] {
  return [
    {
      name: "get_product",
      description:
        "Return Donyapp product identity, audience, and discovery links (OpenAPI, MCP, OAuth, marketing pages).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "get_features",
      description:
        "List Donyapp feature areas and Free plan limits for photographers/videomakers.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "get_pricing",
      description: "Return Free and Pro pricing in BRL cents (monthly and yearly).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "get_health",
      description: "Check that the Donyapp public Agent API is reachable.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "get_my_profile",
      description:
        "Return the authenticated user's profile summary. Requires OAuth Bearer token with scope profile:read.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "get_my_account",
      description:
        "Return the authenticated studio account name and plan. Requires OAuth Bearer token with scope account:read. Never returns client/job PII.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
  ];
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function errorResult(message: string, isError = true) {
  return {
    isError,
    content: [{ type: "text", text: message }],
  };
}

export async function callMcpTool(
  name: string,
  _args: Record<string, unknown> | undefined,
  auth: BearerAuth | null,
) {
  switch (name) {
    case "get_product":
      return textResult(publicProduct());
    case "get_features":
      return textResult(publicFeatures());
    case "get_pricing":
      return textResult(publicPricing());
    case "get_health":
      return textResult(publicHealth());
    case "get_my_profile": {
      if (!auth) return errorResult("Unauthorized: Bearer token with profile:read required");
      if (!hasScope(auth.scopes, "profile:read")) {
        return errorResult("Forbidden: missing scope profile:read");
      }
      const profile = await loadUserSummary(auth.userId);
      if (!profile) return errorResult("Profile not found");
      return textResult(profile);
    }
    case "get_my_account": {
      if (!auth) return errorResult("Unauthorized: Bearer token with account:read required");
      if (!hasScope(auth.scopes, "account:read")) {
        return errorResult("Forbidden: missing scope account:read");
      }
      const profile = await loadUserSummary(auth.userId);
      if (!profile?.accountId) return errorResult("Account not found");
      const account = await loadAccountSummary(profile.accountId);
      if (!account) return errorResult("Account not found");
      return textResult(account);
    }
    default:
      return errorResult(`Unknown tool: ${name}`);
  }
}

export function mcpManifest(baseUrl: string = siteUrl()) {
  const tools = mcpTools();
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
    name: "donyapp",
    description: `${SITE_DESCRIPTION} MCP tools for catalog, pricing, and scoped account reads.`,
    version: MCP_SERVER_VERSION,
    remotes: [{ type: "streamable-http", url: `${baseUrl}/api/mcp` }],
    // Compatibility fields used by various scanners
    url: `${baseUrl}/api/mcp`,
    transport: "streamable-http",
    capabilities: { tools: true, resources: false },
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
}

export function mcpServerCard(baseUrl: string = siteUrl()) {
  const tools = mcpTools();
  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    version: MCP_SERVER_VERSION,
    serverUrl: `${baseUrl}/api/mcp`,
    transport: "streamable-http",
    protocolVersion: MCP_PROTOCOL_VERSION,
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
}

export async function handleMcpJsonRpc(
  message: Record<string, unknown>,
  auth: BearerAuth | null,
): Promise<{ body: unknown; sessionId?: string } | { notification: true }> {
  const method = typeof message.method === "string" ? message.method : "";
  const id = message.id;
  const params =
    message.params && typeof message.params === "object"
      ? (message.params as Record<string, unknown>)
      : {};

  // Notifications have no id
  if (id === undefined && method.startsWith("notifications/")) {
    return { notification: true };
  }

  const respond = (result: unknown) => ({
    body: { jsonrpc: "2.0", id: id ?? null, result },
  });
  const respondError = (code: number, messageText: string) => ({
    body: {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message: messageText },
    },
  });

  switch (method) {
    case "initialize": {
      const sessionId = `mcp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      return {
        sessionId,
        body: {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: { listChanged: false },
            },
            serverInfo: {
              name: "donyapp",
              version: MCP_SERVER_VERSION,
              title: SITE_NAME,
            },
            instructions:
              "Use get_product, get_features, and get_pricing without auth. Authenticated tools need OAuth Bearer (see /.well-known/oauth-protected-resource).",
          },
        },
      };
    }
    case "ping":
      return respond({});
    case "tools/list":
      return respond({ tools: mcpTools() });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      if (!name) return respondError(-32602, "Missing tool name");
      const result = await callMcpTool(name, args, auth);
      return respond(result);
    }
    case "resources/list":
      return respond({ resources: [] });
    case "prompts/list":
      return respond({ prompts: [] });
    default:
      if (!method) return respondError(-32600, "Invalid Request");
      return respondError(-32601, `Method not found: ${method}`);
  }
}
