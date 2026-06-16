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

/** Busca o logo apenas de domínios Supabase confiáveis (evita SSRF). */
export async function fetchWatermarkLogoBuffer(
  logoUrl: string | null | undefined
): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const url = new URL(logoUrl);
    const isTrustedStorage =
      (url.protocol === "https:" &&
        (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.in"))) ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL
        ? url.hostname === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : false);
    if (!isTrustedStorage) return null;
    const res = await fetch(logoUrl, { redirect: "error" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {
    // fallback para marca de texto
  }
  return null;
}
