import { FormulariosNav } from "./formularios-nav";

export default function FormulariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-b border-ds-border px-4 pb-0 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-2xl font-bold text-ds-ink">Formulários</h1>
          <FormulariosNav />
        </div>
      </div>
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
