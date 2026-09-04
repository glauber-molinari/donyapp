import { jsonOk } from "@/lib/agent/api/errors";
import {
  catalogMethodNotAllowed,
  optionsCatalog,
} from "@/lib/agent/api/route-helpers";
import { siteUrl } from "@/lib/agent/site";

export const dynamic = "force-dynamic";

export function GET() {
  const base = siteUrl();
  return jsonOk({
    version: "v1",
    openapi: `${base}/openapi.json`,
    catalog: `${base}/api`,
    routes: [
      { path: "/api/v1/health", methods: ["GET"] },
      { path: "/api/v1/product", methods: ["GET"] },
      { path: "/api/v1/features", methods: ["GET"] },
      { path: "/api/v1/pricing", methods: ["GET"] },
      { path: "/api/v1/me", methods: ["GET"], auth: "Bearer profile:read" },
      { path: "/api/v1/account", methods: ["GET"], auth: "Bearer account:read" },
    ],
  });
}

export function OPTIONS() {
  return optionsCatalog();
}

export function POST() {
  return catalogMethodNotAllowed();
}

export function PUT() {
  return catalogMethodNotAllowed();
}

export function PATCH() {
  return catalogMethodNotAllowed();
}

export function DELETE() {
  return catalogMethodNotAllowed();
}
