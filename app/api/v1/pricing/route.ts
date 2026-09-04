import { publicPricing } from "@/lib/agent/api/catalog";
import { jsonOk } from "@/lib/agent/api/errors";
import {
  catalogMethodNotAllowed,
  optionsCatalog,
} from "@/lib/agent/api/route-helpers";

export const dynamic = "force-dynamic";

export function GET() {
  return jsonOk(publicPricing());
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
