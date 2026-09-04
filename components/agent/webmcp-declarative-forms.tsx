import { WEBMCP_CATALOG_TOOLS } from "@/lib/agent/webmcp/catalog-tools";

/**
 * Server-rendered declarative WebMCP forms (toolname / tooldescription).
 * Evidence for scanners; imperative registerTool remains the primary surface.
 * Visually hidden but present in the DOM for agents.
 */
export function WebMcpDeclarativeForms() {
  return (
    <aside
      className="sr-only"
      aria-label="Ferramentas WebMCP para agentes"
      data-webmcp="declarative"
    >
      {WEBMCP_CATALOG_TOOLS.map((tool) => {
        const formAttrs = {
          toolname: tool.name,
          tooldescription: tool.description,
          toolautosubmit: "true",
        };
        return (
          <form
            key={tool.name}
            action={tool.path}
            method="get"
            data-webmcp-tool={tool.name}
            {...formAttrs}
          >
            <button type="submit">{tool.name}</button>
          </form>
        );
      })}
    </aside>
  );
}
