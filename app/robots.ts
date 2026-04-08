import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  const base = new URL(appUrl);

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/termos-de-servico", "/politica-de-privacidade"],
        disallow: [
          "/admin",
          "/admin/",
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
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}

