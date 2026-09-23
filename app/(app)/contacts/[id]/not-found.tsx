import Link from "next/link";

export default function ContactNotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <div>
        <p className="text-sm font-medium text-ds-muted">Contato</p>
        <h1 className="mt-1 text-2xl font-bold text-ds-ink">Contato não encontrado</h1>
        <p className="mt-2 max-w-md text-sm text-ds-muted">
          Esse contato não existe mais ou não pertence à sua conta.
        </p>
      </div>
      <Link
        href="/contacts"
        className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-ds-accent px-4 text-sm font-medium text-white shadow-ds-sm transition-colors duration-ds hover:brightness-95"
      >
        Voltar aos contatos
      </Link>
    </div>
  );
}
