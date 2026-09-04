import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";

import { homeJsonLdGraph, OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/agent/site";
import { LandingPage } from "@/components/marketing/landing-page";
import { WebMcpSurface } from "@/components/agent/webmcp-surface";

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
  other: {
    "api-catalog": `${siteUrl()}/api`,
  },
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
export default async function Home() {
  const jsonLd = homeJsonLdGraph();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const base = siteUrl();
  return (
    <>
      <link rel="service-desc" href={`${base}/openapi.json`} type="application/openapi+json" />
      <link rel="api-catalog" href={`${base}/api`} type="application/json" />
      <link rel="describedby" href={`${base}/llms.txt`} type="text/plain" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script src="/webmcp-register.js" strategy="afterInteractive" nonce={nonce} />
      <WebMcpSurface />
      <LandingPage displayClassName={inter.className} bodyClassName={inter.className} />
    </>
  );
}
