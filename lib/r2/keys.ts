/** Chave do arquivo original no R2 (nunca exposta publicamente). */
export function originalKey(
  accountId: string,
  jobId: string,
  galleryId: string,
  photoId: string,
  ext: string
): string {
  return `${accountId}/${jobId}/${galleryId}/original/${photoId}.${ext}`;
}

/** Chave da versão com marca d'água (cacheada no R2 para evitar reprocessamento). */
export function watermarkedKey(
  accountId: string,
  jobId: string,
  galleryId: string,
  photoId: string,
  width?: number
): string {
  const suffix = width ? `_w${width}` : "";
  return `${accountId}/${jobId}/${galleryId}/watermarked/${photoId}${suffix}.jpg`;
}

/** Extrai a extensão do nome de arquivo (sem o ponto). */
export function extFromFilename(filename: string): string {
  const parts = filename.split(".");
  return (parts[parts.length - 1] ?? "jpg").toLowerCase();
}

/** Deriva a chave watermarked a partir da chave original. */
export function watermarkedKeyFromOriginal(
  r2Key: string,
  photoId: string,
  width?: number,
  options?: { variant?: "view"; configKey?: string }
): string {
  const suffix = width ? `_w${width}` : "";
  const variantSuffix = options?.variant === "view" ? "_view" : "";
  const configSuffix = options?.configKey ? `_${options.configKey}` : "";
  return r2Key
    .replace(
      `/original/${photoId}`,
      `/watermarked/${photoId}${suffix}${variantSuffix}${configSuffix}`
    )
    .replace(/\.[^.]+$/, ".jpg");
}

/** Deriva a chave de miniatura redimensionada (modo entrega) a partir da chave original. */
export function resizedKeyFromOriginal(r2Key: string, photoId: string, width: number): string {
  return r2Key
    .replace(`/original/${photoId}`, `/resized/${photoId}_w${width}`)
    .replace(/\.[^.]+$/, ".jpg");
}
