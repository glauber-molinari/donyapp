import sharp from "sharp";

import type { WatermarkConfig } from "@/types/gallery";

const MAX_DIMENSION = 2000;

export async function applyWatermark(
  originalBuffer: Buffer,
  config: WatermarkConfig,
  logoBuffer: Buffer | null
): Promise<Buffer> {
  let img = sharp(originalBuffer).rotate(); // auto-orient via EXIF

  const meta = await img.metadata();
  const w = meta.width ?? 1200;
  const h = meta.height ?? 900;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    img = img.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside" });
  }

  const resized = await img.toBuffer({ resolveWithObject: true });
  const rw = resized.info.width;
  const scaleRatio = (config.scale ?? 20) / 100;
  const opacityPercent = Math.round(Math.max(0, Math.min(100, config.opacity ?? 40)));
  const rotation = config.rotation ?? -30;

  // Build overlay with opacity baked into the alpha channel
  let rawOverlay: Buffer;

  if (logoBuffer) {
    const logoSize = Math.round(rw * scaleRatio);
    rawOverlay = await sharp(logoBuffer)
      .resize(logoSize, logoSize, { fit: "inside" })
      .ensureAlpha()
      .toBuffer();
  } else {
    const text = config.text ?? "© Dony.app";
    const fontSize = Math.max(12, Math.round(rw * scaleRatio * 0.55));
    const textW = Math.round(fontSize * text.length * 0.6);
    const textH = Math.round(fontSize * 1.4);
    const alpha = (opacityPercent / 100).toFixed(2);
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${textW}" height="${textH}">
      <text x="0" y="${fontSize}" font-family="sans-serif" font-size="${fontSize}" fill="white" opacity="${alpha}">${text}</text>
    </svg>`;
    rawOverlay = await sharp(Buffer.from(svgText)).ensureAlpha().toBuffer();
  }

  // Bake opacity into the alpha channel so composite doesn't need an `opacity` option
  const [overlayMeta] = await Promise.all([sharp(rawOverlay).metadata()]);
  const ow = overlayMeta.width ?? 100;
  const oh = overlayMeta.height ?? 100;
  const alphaMultiplier = opacityPercent / 100;

  // Use a transparent PNG with the desired fill to modulate alpha
  const transparentPng = await sharp({
    create: { width: ow, height: oh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: alphaMultiplier } },
  })
    .png()
    .toBuffer();

  const overlayWithOpacity = await sharp(rawOverlay)
    .ensureAlpha()
    .composite([{ input: transparentPng, blend: "dest-in" }])
    .png()
    .toBuffer();

  const result = await sharp(resized.data)
    .composite([
      {
        input: overlayWithOpacity,
        tile: true,
        blend: "over",
        ...(rotation !== 0 ? { angle: rotation } : {}),
      },
    ])
    .jpeg({ quality: 82 })
    .toBuffer();

  return result;
}
