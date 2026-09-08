import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VisualPreviewClient } from "./visual-preview-client";

export const metadata: Metadata = {
  title: "Preview visual · CareOps",
  robots: { index: false, follow: false },
};

function previewAllowed() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  );
}

/**
 * Área pública (sem login) para validar o visual CareOps no Preview da Vercel
 * e no localhost — evita OAuth que redireciona para produção.
 */
export default function VisualPreviewPage() {
  if (!previewAllowed()) notFound();

  return <VisualPreviewClient />;
}
