import { notFoundApi } from "@/lib/agent/api/errors";
import {
  catalogMethodNotAllowed,
  optionsCatalog,
} from "@/lib/agent/api/route-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: { path?: string[] } };

function missing(ctx: Ctx) {
  const suffix = (ctx.params.path ?? []).join("/");
  return notFoundApi(`/api/v1/${suffix}`);
}

export function GET(_request: Request, ctx: Ctx) {
  return missing(ctx);
}

export function HEAD(_request: Request, ctx: Ctx) {
  return missing(ctx);
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

export function OPTIONS() {
  return optionsCatalog();
}
