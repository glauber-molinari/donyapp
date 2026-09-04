import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

import { AppToaster } from "@/components/ui/app-toaster";
import {
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
} from "@/lib/agent/site";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl = siteUrl() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${SITE_NAME} | Gestão de pós-produção`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "pós-produção",
    "kanban",
    "fotógrafo",
    "videomaker",
    "estúdio",
    "edição",
    "prazos",
    "clientes",
  ],
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Gestão de pós-produção`,
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
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Donyapp",
  },
  /** Chrome recomenda além de apple-mobile-web-app-capable (gerado por appleWebApp). */
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    /** PNG primeiro: favicon SVG ainda falha em alguns browsers / abas. */
    icon: [
      { url: "/brand/icon-dony-laranja.png", sizes: "69x73", type: "image/png" },
      { url: "/logo-dony-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/brand/icon-dony-laranja.png",
    apple: "/brand/icon-dony-laranja.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f2ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pt-BR">
      <head>
        <meta
          name="caramelosec-token"
          content="2808dcae-6f69-43d7-9e44-e6b6ac706447"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        nonce={nonce}
      >
        {children}
        <AppToaster />
        <Analytics />
      </body>
    </html>
  );
}
