/** Site identity used by JSON-LD, llms.txt, markdown mirrors, and trust pages. */

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.donyapp.com"
  ).replace(/\/$/, "");
}

export const SITE_NAME = "Donyapp";

export const SITE_DESCRIPTION =
  "App de gestão de pós-produção para fotógrafos e videomakers: kanban de edição, clientes, prazos, formulários e agenda.";

export const SUPPORT_EMAIL = "suporte@donyapp.com";

export const INSTAGRAM_URL = "https://www.instagram.com/dony__app/";

/**
 * JSON-LD `sameAs` profiles.
 * When Wikidata (P856) / Wikipedia exist for Donyapp, append those canonical URLs here.
 * Do not invent Wikipedia/Wikidata entries — notability + press + Wikidata item first.
 */
export function organizationSameAs(): string[] {
  return [
    INSTAGRAM_URL,
    // Wikidata entity URL (e.g. https://www.wikidata.org/wiki/Q…) — add when item exists
    // Wikipedia article URL (language edition) — add when article exists
  ];
}

/** OG / social share image (absolute path under public/). */
export const OG_IMAGE_PATH = "/marketing/kanban-oficial.png";

export function organizationJsonLd(baseUrl: string = siteUrl()) {
  return {
    "@type": "Organization" as const,
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: baseUrl,
    logo: `${baseUrl}/brand/logo-dony-png.png`,
    email: SUPPORT_EMAIL,
    sameAs: organizationSameAs(),
    contactPoint: [
      {
        "@type": "ContactPoint" as const,
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["Portuguese", "pt-BR"],
        url: `${baseUrl}/contact`,
      },
    ],
    address: {
      "@type": "PostalAddress" as const,
      addressCountry: "BR",
      addressLocality: "Brasil",
    },
  };
}

export function softwareApplicationJsonLd(baseUrl: string = siteUrl()) {
  return {
    "@type": "SoftwareApplication" as const,
    "@id": `${baseUrl}/#software`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "BRL",
      description: "Plano Free com upgrade Pro opcional",
    },
    publisher: { "@id": `${baseUrl}/#organization` },
  };
}

export function websiteJsonLd(baseUrl: string = siteUrl()) {
  return {
    "@type": "WebSite" as const,
    "@id": `${baseUrl}/#website`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: baseUrl,
    inLanguage: "pt-BR",
    publisher: { "@id": `${baseUrl}/#organization` },
  };
}

export function homeJsonLdGraph(baseUrl: string = siteUrl()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(baseUrl),
      softwareApplicationJsonLd(baseUrl),
      websiteJsonLd(baseUrl),
    ],
  };
}
