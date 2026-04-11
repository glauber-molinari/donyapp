import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { PorQueUsarMarketingPage } from "@/components/marketing/por-que-usar-marketing-page";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Por que usar o Donyapp?",
  description:
    "Entenda em poucos minutos por que o Donyapp foi feito para o fluxo real de pós-produção: kanban, prazos, contatos e equipe no mesmo lugar.",
};

export default function PorQueUsarPage() {
  return <PorQueUsarMarketingPage displayClassName={inter.className} bodyClassName={inter.className} />;
}
