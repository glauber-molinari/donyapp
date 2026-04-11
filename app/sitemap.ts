import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(appUrl);
  const now = new Date();

  return [
    {
      url: new URL("/", base).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
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

