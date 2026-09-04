"use client";

import { useEffect } from "react";

import { WEBMCP_CATALOG_TOOLS } from "@/lib/agent/webmcp/catalog-tools";

type ModelContextLike = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations?: Record<string, boolean>;
      execute: (
        args: Record<string, unknown>,
        extras?: { signal?: AbortSignal },
      ) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
};

function resolveModelContext(): ModelContextLike | null {
  if (typeof document === "undefined") return null;
  const doc = document as Document & { modelContext?: ModelContextLike };
  const nav = typeof navigator !== "undefined"
    ? (navigator as Navigator & { modelContext?: ModelContextLike })
    : null;
  // Prefer document.modelContext; navigator is deprecated trailing fallback.
  const ctx = doc.modelContext ?? nav?.modelContext ?? null;
  if (!ctx || typeof ctx.registerTool !== "function") return null;
  return ctx;
}

async function fetchJson(path: string, signal?: AbortSignal) {
  const res = await fetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    credentials: "same-origin",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              status: res.status,
              path,
              body: data,
            },
            null,
            2,
          ),
        },
      ],
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

/**
 * Registers same-origin WebMCP tools that call the public Agent API.
 * Scanners look for document.modelContext.registerTool in page scripts.
 */
export function WebMcpBootstrap() {
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function register() {
      const modelContext = resolveModelContext();
      if (!modelContext || cancelled) return;

      for (const tool of WEBMCP_CATALOG_TOOLS) {
        if (cancelled) break;
        try {
          await modelContext.registerTool(
            {
              name: tool.name,
              description: tool.description,
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
              annotations: tool.annotations,
              execute: async (_args, extras) =>
                fetchJson(tool.path, extras?.signal ?? controller.signal),
            },
            { signal: controller.signal },
          );
        } catch {
          // Duplicate name / unsupported browser build — ignore.
        }
      }
    }

    void register();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return null;
}
