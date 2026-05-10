import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LegalLinks } from "@/components/legal/legal-links";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta | Donyapp",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-canvas px-4">
      <div className="w-full max-w-sm rounded-ds-xl border border-app-border bg-app-sidebar p-8 shadow-ds-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/brand/logo-dony-png.png"
            alt="Donyapp"
            width={120}
            height={32}
            className="h-8 w-auto max-w-[11rem] object-contain"
            priority
          />
        </div>
        <h1 className="mb-1 text-center text-base font-semibold text-ds-ink">Criar conta</h1>
        <p className="mb-6 text-center text-sm text-ds-muted">
          Gestão de pós-produção para fotógrafos e videomakers.
        </p>
        <SignupForm />
        <p className="mt-6 text-center text-xs text-ds-subtle">
          Ao criar conta, você concorda com os{" "}
          <Link href="/termos-de-servico" className="underline-offset-4 hover:underline">
            Termos de Serviço
          </Link>{" "}
          e a{" "}
          <Link href="/politica-de-privacidade" className="underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-app-primary transition duration-ds ease-out hover:brightness-95"
      >
        Voltar
      </Link>
      <div className="mt-4 text-center text-xs text-ds-subtle">
        <LegalLinks linkClassName="text-ds-subtle hover:text-ds-ink" />
      </div>
    </div>
  );
}
