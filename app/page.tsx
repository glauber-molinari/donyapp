import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { LandingPage } from "@/components/marketing/landing-page";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-landing-body",
});

export const metadata: Metadata = {
  title: "Donyapp — Kanban de pós-produção para fotógrafos e videomakers",
  description:
    "Organize edições, prazos e clientes em um fluxo feito para estúdios e freelancers. Comece grátis.",
};

/**
 * Landing pública em /. Visitantes veem a página; usuários logados são
 * redirecionados ao dashboard pelo middleware.
 */
export default function Home() {
  return (
    <LandingPage displayClassName={display.className} bodyClassName={body.className} />
  );
}
