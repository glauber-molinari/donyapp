import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/agent/site";

export default function robots(): MetadataRoute.Robots {
  const base = new URL(siteUrl() || "https://www.donyapp.com");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/privacy",
          "/llms.txt",
          "/por-que-usar",
          "/termos-de-servico",
          "/politica-de-privacidade",
          "/blog",
        ],
        disallow: [
          "/login",
          "/login/",
          "/invite",
          "/invite/",
          "/board",
          "/board/",
          "/dashboard",
          "/dashboard/",
          "/contacts",
          "/contacts/",
          "/agenda",
          "/agenda/",
          "/settings",
          "/settings/",
          "/p/",
          "/g/",
          "/galerias",
          "/galerias/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
