import { SettingsNav } from "./settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:gap-10">
      <div className="lg:w-56 lg:shrink-0" id="tour-settings-sidebar">
        <h1 className="text-2xl font-bold text-ds-ink">Configurações</h1>
        <div className="mt-6">
          <SettingsNav />
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
