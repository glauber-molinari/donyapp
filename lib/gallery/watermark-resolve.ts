import {
  pathFromWatermarkLogoUrl,
  WATERMARK_LOGOS_BUCKET,
} from "@/lib/gallery/watermark-logo";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WatermarkConfig } from "@/types/gallery";

const DEFAULT_CONFIG: WatermarkConfig = {
  opacity: 40,
  scale: 20,
  rotation: -30,
};

export function resolveWatermarkConfig(
  accountWm: WatermarkConfig | null,
  accountName?: string | null
): WatermarkConfig {
  const wmConfig: WatermarkConfig = accountWm ?? {
    ...DEFAULT_CONFIG,
    type: "text",
    text: `© ${accountName ?? "Studio"}`,
  };
  if (!wmConfig.text) {
    wmConfig.text = `© ${accountName ?? "Studio"}`;
  }
  return wmConfig;
}

/** Hostnames confiáveis para fetch HTTPS do logo (domínio customizado da API Supabase). */
function trustedStorageHostnames(): Set<string> {
  const hosts = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw?.trim()) return;
    try {
      hosts.add(new URL(raw.trim()).hostname);
    } catch {
      // ignore
    }
  };

  add(process.env.NEXT_PUBLIC_SUPABASE_URL);
  for (const part of (process.env.NEXT_PUBLIC_SUPABASE_CSP_ORIGINS ?? "").split(/[,;\s]+/)) {
    add(part);
  }
  add("https://auth.donyapp.com");

  return hosts;
}

function isTrustedStorageUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.in")) {
    return true;
  }
  return trustedStorageHostnames().has(url.hostname);
}

/**
 * Carrega o buffer do logo da marca d'água.
 * Prioriza download via Storage API (funciona com domínio customizado auth.donyapp.com).
 */
export async function fetchWatermarkLogoBuffer(
  logoUrl: string | null | undefined
): Promise<Buffer | null> {
  if (!logoUrl?.trim()) return null;

  const storagePath = pathFromWatermarkLogoUrl(logoUrl);
  if (storagePath) {
    const svc = createServiceRoleClient();
    if (svc) {
      const { data, error } = await svc.storage
        .from(WATERMARK_LOGOS_BUCKET)
        .download(storagePath);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
    }
  }

  try {
    const url = new URL(logoUrl);
    if (!isTrustedStorageUrl(url)) return null;
    const res = await fetch(logoUrl, { redirect: "error" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {
    // fallback para marca de texto em applyWatermark
  }

  return null;
}
