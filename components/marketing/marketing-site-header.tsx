import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type MarketingNavItem = { readonly href: string; readonly label: string };

/** Links âncora na própria landing (`/`). */
export const marketingLandingNavItems: readonly MarketingNavItem[] = [
  { href: "#sobre", label: "Sobre" },
  { href: "#prova", label: "Resultados" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
] as const;

/** Mesmas seções da home, com prefixo para uso fora da `/` (ex.: `/por-que-usar`). */
export const marketingHomeAnchoredNavItems: readonly MarketingNavItem[] = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#prova", label: "Resultados" },
  { href: "/#planos", label: "Planos" },
  { href: "/#faq", label: "FAQ" },
] as const;

function MarketingFloatingNav({
  items,
  className,
}: {
  items: readonly MarketingNavItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Seções da página inicial"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-ds-border bg-white/95 px-1 py-1 shadow-ds-md backdrop-blur-md",
        className,
      )}
    >
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-ds-ink transition duration-ds ease-out hover:bg-ds-cream sm:px-4"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MarketingSiteHeader({ navItems }: { navItems: readonly MarketingNavItem[] }) {
  return (
    <header className="fixed top-0 z-50 w-full bg-ds-cream/70 transition-colors supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-4 pb-3 pt-3 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[3rem] flex-col gap-3 lg:block lg:min-h-[3.25rem]">
          <div className="flex items-center justify-between gap-3 lg:contents">
            <div className="flex shrink-0 items-center lg:absolute lg:left-0 lg:top-1/2 lg:z-[1] lg:-translate-y-1/2">
              <Link
                href="/"
                className="flex items-center justify-center font-semibold tracking-tight text-ds-ink"
              >
                <Image
                  src="/brand/logo-dony-png.png"
                  alt="Donyapp"
                  width={120}
                  height={32}
                  className="h-7 w-auto max-w-[9.5rem] object-contain sm:h-8 sm:max-w-[10.5rem]"
                  priority
                />
              </Link>
            </div>

            <div className="hidden justify-center lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2">
              <MarketingFloatingNav items={navItems} />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-4 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2">
              <Link
                href="/login"
                className="text-[0.9rem] font-medium text-ds-ink transition duration-ds ease-out hover:opacity-80"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-ds-accent px-4 py-2 text-[0.85rem] font-semibold text-white transition duration-ds ease-out hover:brightness-95 sm:px-5 sm:text-[0.9rem]"
              >
                Começar grátis
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:hidden">
            <MarketingFloatingNav items={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
