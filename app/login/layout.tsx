import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o Donyapp com sua Conta Google.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
