/**
 * Same-origin WebMCP registration for static analysis / early boot.
 * Prefer document.modelContext; navigator.modelContext is trailing fallback.
 * Loaded as a classic script so scanners see registerTool in page source trees.
 */
(function () {
  var tools = [
    {
      name: "get_product",
      description:
        "Fetches Donyapp product identity, audience, and discovery links from GET /api/v1/product. Returns JSON with name, description, and links (OpenAPI, MCP, OAuth, marketing pages).",
      path: "/api/v1/product",
    },
    {
      name: "get_features",
      description:
        "Fetches Donyapp feature areas and Free plan limits from GET /api/v1/features. Returns JSON listing kanban, contacts, forms, agenda, team, and delivery.",
      path: "/api/v1/features",
    },
    {
      name: "get_pricing",
      description:
        "Fetches Free and Pro pricing in BRL cents from GET /api/v1/pricing. Returns monthly and yearly prices plus plan highlights.",
      path: "/api/v1/pricing",
    },
    {
      name: "get_health",
      description:
        'Checks that the Donyapp public Agent API is reachable via GET /api/v1/health. Returns { status: "ok", service, time }.',
      path: "/api/v1/health",
    },
  ];

  function modelContext() {
    var doc = document;
    var nav = typeof navigator !== "undefined" ? navigator : null;
    return (
      (doc && doc.modelContext) ||
      (nav && nav.modelContext) ||
      null
    );
  }

  function fetchJson(path) {
    return fetch(path, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = text;
        try {
          data = JSON.parse(text);
        } catch (e) {}
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
          ok: res.ok,
          status: res.status,
        };
      });
    });
  }

  function registerAll() {
    var ctx = modelContext();
    if (!ctx || typeof ctx.registerTool !== "function") return;
    tools.forEach(function (tool) {
      try {
        ctx.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: {
            readOnlyHint: true,
            consequentialHint: false,
            untrustedContentHint: false,
          },
          execute: function () {
            return fetchJson(tool.path);
          },
        });
      } catch (e) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerAll);
  } else {
    registerAll();
  }
})();
