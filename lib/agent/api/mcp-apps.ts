/** MCP Apps (ui://) resources linked from catalog tools via `_meta.ui.resourceUri`. */

export const MCP_APP_MIME = "text/html;profile=mcp-app";

export type McpUiResource = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  html: string;
};

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: light; --ink:#1a1614; --muted:#6b635c; --accent:#ff5500; --bg:#f5f2ef; --line:#e4ddd6; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--ink); padding: 16px; line-height: 1.45; }
    h1 { font-size: 1.15rem; margin: 0 0 8px; }
    p, li { color: var(--muted); font-size: 0.9rem; }
    .card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; margin-top: 12px; }
    .accent { color: var(--accent); font-weight: 700; }
    ul { margin: 8px 0 0; padding-left: 1.1rem; }
    code { font-size: 0.8rem; background: #efeae4; padding: 1px 5px; border-radius: 4px; }
    .muted { color: var(--muted); font-size: 0.8rem; }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>
    (function () {
      function paint(data) {
        var el = document.getElementById("data");
        if (!el || data == null) return;
        el.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      }
      window.addEventListener("message", function (ev) {
        var msg = ev.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "ui/notifications/tool-result" || msg.method === "ui/notifications/tool-result") {
          var result = msg.params && (msg.params.structuredContent || msg.params.result || msg.params);
          paint(result);
        }
      });
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} }, "*");
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;
}

export function mcpAppResources(): McpUiResource[] {
  return [
    {
      uri: "ui://donyapp/product.html",
      name: "Donyapp product",
      description: "Interactive summary of product identity and discovery links.",
      mimeType: MCP_APP_MIME,
      html: shell(
        "Donyapp — produto",
        `<h1>Donyapp <span class="accent">produto</span></h1>
         <p>Gestão de pós-produção para fotógrafos e videomakers.</p>
         <div class="card"><pre id="data" class="muted">Aguardando resultado da tool get_product…</pre></div>
         <p class="muted">Fonte: <code>GET /api/v1/product</code></p>`,
      ),
    },
    {
      uri: "ui://donyapp/features.html",
      name: "Donyapp features",
      description: "Interactive list of feature areas and Free plan limits.",
      mimeType: MCP_APP_MIME,
      html: shell(
        "Donyapp — recursos",
        `<h1>Recursos</h1>
         <p>Áreas do produto e limites do plano Free.</p>
         <div class="card"><pre id="data" class="muted">Aguardando resultado da tool get_features…</pre></div>
         <p class="muted">Fonte: <code>GET /api/v1/features</code></p>`,
      ),
    },
    {
      uri: "ui://donyapp/pricing.html",
      name: "Donyapp pricing",
      description: "Interactive Free and Pro pricing (BRL).",
      mimeType: MCP_APP_MIME,
      html: shell(
        "Donyapp — preços",
        `<h1>Preços</h1>
         <p>Planos Free e Pro em reais (centavos no JSON).</p>
         <div class="card"><pre id="data" class="muted">Aguardando resultado da tool get_pricing…</pre></div>
         <p class="muted">Fonte: <code>GET /api/v1/pricing</code></p>`,
      ),
    },
    {
      uri: "ui://donyapp/health.html",
      name: "Donyapp health",
      description: "Agent API health status panel.",
      mimeType: MCP_APP_MIME,
      html: shell(
        "Donyapp — health",
        `<h1>Health</h1>
         <p>Status do Agent API público.</p>
         <div class="card"><pre id="data" class="muted">Aguardando resultado da tool get_health…</pre></div>
         <p class="muted">Fonte: <code>GET /api/v1/health</code></p>`,
      ),
    },
  ];
}

export function findMcpAppResource(uri: string): McpUiResource | undefined {
  return mcpAppResources().find((r) => r.uri === uri);
}

export function toolUiMeta(resourceUri: string) {
  return {
    ui: {
      resourceUri,
      visibility: ["model", "app"] as Array<"model" | "app">,
    },
    /** @deprecated Compatibility with hosts that still read the flat key. */
    "ui/resourceUri": resourceUri,
  };
}
