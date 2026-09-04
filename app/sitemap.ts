import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/agent/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(siteUrl() || "https://www.donyapp.com");
  const now = new Date();

  return [
    {
      url: new URL("/", base).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/about", base).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: new URL("/contact", base).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: new URL("/privacy", base).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: new URL("/por-que-usar", base).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: new URL("/termos-de-servico", base).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: new URL("/politica-de-privacidade", base).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
