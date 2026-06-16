import { appOrigin } from "@/lib/app-url";

/** URL pública da galeria (`/g/[slug]`). */
export function galleryPublicUrl(slug: string): string {
  const base = appOrigin() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/g/${slug}`;
}
