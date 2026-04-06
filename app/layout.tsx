import type { Metadata, Viewport } from "next";
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
    default: "Donyapp — Gestão de pós-produção",
    template: "%s | Donyapp",
  },
  description:
    "Kanban de edição, prazos e clientes para fotógrafos e videomakers. Organize sua pós-produção em um fluxo feito para o estúdio.",
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
    title: "Donyapp — Gestão de pós-produção",
    description:
      "Organize edições, prazos e clientes em um fluxo feito para estúdios e freelancers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donyapp — Gestão de pós-produção",
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
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
