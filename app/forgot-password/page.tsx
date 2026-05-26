import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci a senha | Donyapp",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ds-cream px-4">
      <div className="w-full max-w-sm rounded-ds-xl border border-ds-border bg-ds-surface p-8 shadow-ds-sm">
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
        <h1 className="mb-1 text-center text-base font-semibold text-ds-ink">Esqueci a senha</h1>
        <p className="mb-6 text-center text-sm text-ds-muted">
          Informe seu email e enviaremos um link para redefinir sua senha.
        </p>
        <ForgotPasswordForm />
      </div>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-ds-accent transition duration-ds ease-out hover:brightness-95"
      >
        Voltar
      </Link>
    </div>
  );
}
