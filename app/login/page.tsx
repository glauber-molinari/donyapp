import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "./login-form";
import { LegalLinks } from "@/components/legal/legal-links";

const errorMessages: Record<string, string> = {
  auth: "Não foi possível concluir o login. Tente novamente.",
  provision: "Conta criada parcialmente. Entre em contato com o suporte.",
  config: "Configuração do servidor incompleta (Supabase).",
  invite_invalid: "Este convite é inválido ou expirou. Peça um novo convite ao administrador.",
  invite_email: "Entre com a mesma conta Google do e-mail que recebeu o convite.",
  invite_exists: "Esta conta já está cadastrada. Entre normalmente pelo login.",
  invite_config: "Convites exigem configuração do servidor (service role). Contate o suporte.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const err = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const message = err ? (errorMessages[err] ?? "Algo deu errado.") : null;
  const nextRaw = typeof searchParams.next === "string" ? searchParams.next : undefined;
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

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
        <h1 className="sr-only">Donyapp — Entrar</h1>
        <p className="text-center text-sm text-ds-muted">
          Gestão de pós-produção para fotógrafos e videomakers.
        </p>
        {message ? (
          <p
            className="mt-4 rounded-ds-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-ds-subtle">
          Ao entrar, você concorda com os <Link href="/termos-de-servico" className="underline-offset-4 hover:underline">Termos de Serviço</Link> e a{" "}
          <Link href="/politica-de-privacidade" className="underline-offset-4 hover:underline">Política de Privacidade</Link>.
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
