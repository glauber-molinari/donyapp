import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Dony.app com Google ou e-mail e senha.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
