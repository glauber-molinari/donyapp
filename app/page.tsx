import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { homeJsonLdGraph, OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/agent/site";
import { LandingPage } from "@/components/marketing/landing-page";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const canonical = `${siteUrl()}/`;

export const metadata: Metadata = {
  title: `${SITE_NAME} | Gestão de pós-produção para fotógrafos e videomakers`,
  description: SITE_DESCRIPTION,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `${SITE_NAME} | Gestão de pós-produção para fotógrafos e videomakers`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — kanban de pós-produção`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Gestão de pós-produção`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

/**
 * Landing pública em /. Acessível a todos — visitantes e usuários logados.
 * Links de âncora (/#sobre, /#planos, etc.) funcionam sem redirecionamentos.
 */
export default function Home() {
  const jsonLd = homeJsonLdGraph();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage displayClassName={inter.className} bodyClassName={inter.className} />
    </>
  );
}
