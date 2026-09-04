import { methodNotAllowed } from "./errors";

/** Standard JSON 405 handlers for catalog GET-only Agent API routes. */
export function catalogMethodNotAllowed() {
  return methodNotAllowed(["GET", "HEAD", "OPTIONS"]);
}

export function optionsCatalog() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    },
  });
}
