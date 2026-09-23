import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <div>
        <p className="text-sm font-medium text-ds-muted">404</p>
        <h1 className="mt-1 text-2xl font-bold text-ds-ink">Página não encontrada</h1>
        <p className="mt-2 max-w-md text-sm text-ds-muted">
          Esse endereço não existe ou o item foi removido.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-ds-accent px-4 text-sm font-medium text-white shadow-ds-sm transition-colors duration-ds hover:brightness-95"
        >
          Ir ao dashboard
        </Link>
        <Link
          href="/contacts"
          className="inline-flex h-10 items-center justify-center rounded-ds-xl border border-ds-border bg-ds-surface px-4 text-sm font-medium text-ds-ink shadow-ds-sm transition-colors duration-ds hover:bg-ds-cream"
        >
          Contatos
        </Link>
      </div>
    </div>
  );
}
