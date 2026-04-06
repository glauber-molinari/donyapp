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

/**
 * Landing pública em /. Visitantes veem a página; usuários logados são
 * redirecionados ao dashboard pelo middleware.
 */
export default function Home() {
  return (
    <LandingPage displayClassName={inter.className} bodyClassName={inter.className} />
  );
}
