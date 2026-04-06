import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convite",
  description: "Aceite o convite para entrar na equipe no Donyapp.",
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
