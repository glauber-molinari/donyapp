/** Larguras usadas no grid público (srcset). */
export const GRID_WIDTHS = [280, 400, 560] as const;

/** Largura padrão do grid quando o browser não suporta srcset. */
export const GRID_DEFAULT_WIDTH = 400;

/** Lightbox — visualização ampliada. */
export const LIGHTBOX_WIDTH = 1400;

/** Hero / capa — srcset para viewport cheia. */
export const COVER_WIDTHS = [800, 1200, 1600] as const;
export const COVER_DEFAULT_WIDTH = 1200;

/** Miniaturas do painel do fotógrafo. */
export const MANAGE_THUMB_WIDTH = 360;
export const MANAGE_LIST_WIDTH = 280;
export const MANAGE_COVER_WIDTH = 240;

/** Painel de seleção do cliente (thumbs pequenos). */
export const SELECTION_THUMB_WIDTH = 220;

/** Todas as variantes limpas geradas no upload / publish. */
export const PREGENERATE_CLEAN_WIDTHS = [
  220, 240, 280, 300, 360, 400, 560, 800, 1200, 1400, 1600,
] as const;

/** Variantes com marca d'água (modo seleção). */
export const PREGENERATE_WM_GRID_WIDTHS = [...GRID_WIDTHS] as const;
export const PREGENERATE_WM_LIGHTBOX_WIDTH = LIGHTBOX_WIDTH;

export const JPEG_QUALITY_CLEAN = 76;
export const JPEG_QUALITY_WATERMARK = 78;

export type GalleryImageParams = {
  w?: number;
  wm?: boolean;
  cover?: boolean;
  ctx?: "manage";
  display?: "lightbox";
};

/** Monta URL da rota de imagem da galeria. */
export function galleryImageUrl(photoId: string, params: GalleryImageParams = {}): string {
  const qs = new URLSearchParams();
  if (params.w != null) qs.set("w", String(params.w));
  if (params.wm) qs.set("wm", "1");
  if (params.cover) qs.set("cover", "1");
  if (params.ctx) qs.set("ctx", params.ctx);
  if (params.display) qs.set("display", params.display);
  const query = qs.toString();
  return `/api/gallery/image/${photoId}${query ? `?${query}` : ""}`;
}

/** Gera atributo srcSet para múltiplas larguras. */
export function galleryImageSrcSet(
  photoId: string,
  widths: readonly number[],
  params: Omit<GalleryImageParams, "w"> = {}
): string {
  return widths
    .map((w) => `${galleryImageUrl(photoId, { ...params, w })} ${w}w`)
    .join(", ");
}

/** sizes para o grid masonry (2–5 colunas). */
export const GRID_IMAGE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";

/** sizes para hero em tela cheia. */
export const COVER_IMAGE_SIZES = "100vw";

/** Dispara pré-geração em background (não bloqueia UI). */
export function triggerPhotoPregenerate(photoId: string): void {
  void fetch("/api/gallery/pregenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoId }),
  }).catch(() => {});
}

export function triggerGalleryPregenerate(galleryId: string): void {
  void fetch("/api/gallery/pregenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ galleryId }),
  }).catch(() => {});
}
