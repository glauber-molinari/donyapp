import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { LandingPage } from "@/components/marketing/landing-page";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Donyapp — Kanban de pós-produção para fotógrafos e videomakers",
  description:
    "Organize edições, prazos e clientes em um fluxo feito para estúdios e freelancers. Comece grátis.",
};

function homeJsonLd() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://donyapp.com"
  ).replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Donyapp",
        url: siteUrl,
        logo: `${siteUrl}/brand/logo-dony-png.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Donyapp",
        url: siteUrl,
        inLanguage: "pt-BR",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}

/**
 * Landing pública em /. Visitantes veem a página; usuários logados são
 * redirecionados ao dashboard pelo middleware.
 */
export default function Home() {
  const jsonLd = homeJsonLd();
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
