import { WebMcpBootstrap } from "@/components/agent/webmcp-bootstrap";
import { WebMcpDeclarativeForms } from "@/components/agent/webmcp-declarative-forms";

/** Drop-in WebMCP surface for marketing pages (imperative + declarative). */
export function WebMcpSurface() {
  return (
    <>
      <WebMcpDeclarativeForms />
      <WebMcpBootstrap />
    </>
  );
}
