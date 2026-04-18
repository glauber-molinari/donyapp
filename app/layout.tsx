import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Donyapp | Gestão de pós-produção",
    template: "%s | Donyapp",
  },
  description:
    "Kanban de edição, prazos e clientes para fotógrafos e videomakers. Organize a pós-produção num fluxo pensado para o estúdio.",
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
  applicationName: "Donyapp",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Donyapp",
    title: "Donyapp | Gestão de pós-produção",
    description:
      "Organize edições, prazos e clientes num fluxo pensado para estúdios e freelancers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donyapp | Gestão de pós-produção",
    description:
      "Kanban de pós-produção para fotógrafos e videomakers.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f2ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta
          name="caramelosec-token"
          content="2808dcae-6f69-43d7-9e44-e6b6ac706447"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
