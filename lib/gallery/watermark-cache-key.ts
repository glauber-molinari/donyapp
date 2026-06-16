import type { WatermarkConfig } from "@/types/gallery";

function shortHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

/** Versão do algoritmo — incrementar ao corrigir geração (ex.: rotação). */
const WATERMARK_ALGO_VERSION = "v4";

/** Sufixo estável para chaves R2 — muda quando opacidade, tamanho, rotação ou logo mudam. */
export function watermarkConfigCacheKey(
  config: WatermarkConfig,
  logoUrl?: string | null
): string {
  const opacity = Math.round(Math.max(0, Math.min(100, config.opacity ?? 40)));
  const scale = Math.round(config.scale ?? 20);
  const rotation = Math.round(config.rotation ?? -30);
  const logoPart = logoUrl ? shortHash(logoUrl) : "txt";
  return `${WATERMARK_ALGO_VERSION}_o${opacity}s${scale}r${rotation}_${logoPart}`;
}
