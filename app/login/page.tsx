import Link from "next/link";

import { LoginForm } from "./login-form";

const errorMessages: Record<string, string> = {
  auth: "Não foi possível concluir o login. Tente novamente.",
  provision: "Conta criada parcialmente. Entre em contato com o suporte.",
  config: "Configuração do servidor incompleta (Supabase).",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const err = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const message = err ? (errorMessages[err] ?? "Algo deu errado.") : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F0F4F3] px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Donyapp</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestão de pós-produção para fotógrafos e videomakers.
        </p>
        {message ? (
          <p
            className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-gray-500">
          Ao entrar, você concorda em usar apenas sua Conta Google conforme as políticas
          do produto.
        </p>
      </div>
      <Link href="/" className="mt-6 text-sm text-violet-600 hover:text-violet-700">
        Voltar
      </Link>
    </div>
  );
}
