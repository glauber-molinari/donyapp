import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Link público de coleção: feature retirada do ar. */
export default function RetiredPublicGalleryPage() {
  notFound();
}
