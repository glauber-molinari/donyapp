import { publicHealth } from "@/lib/agent/api/catalog";
import { jsonOk } from "@/lib/agent/api/errors";

export const dynamic = "force-dynamic";

export function GET() {
  return jsonOk(publicHealth(), {
    headers: { "Cache-Control": "no-store" },
  });
}
