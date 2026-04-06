import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app-canvas px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium text-ds-muted">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ds-ink">Página não encontrada</h1>
        <p className="mt-2 max-w-md text-sm text-ds-muted">
          O endereço pode estar incorreto ou o conteúdo foi movido.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-app-primary px-4 text-sm font-medium text-white shadow-sm transition-colors duration-ds hover:brightness-95"
        >
          Ir ao início
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-ds-xl border border-app-border bg-app-sidebar px-4 text-sm font-medium text-ds-ink shadow-sm transition-colors duration-ds hover:bg-ds-cream"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
