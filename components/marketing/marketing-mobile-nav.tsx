"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function MarketingMobileNav({
  items,
}: {
  items: readonly { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ds-ink transition duration-ds ease-out hover:bg-ds-cream"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <>
          <div className="fixed inset-x-0 bottom-0 top-[4.5rem] z-40 bg-ds-ink/20 lg:hidden" aria-hidden />
          <div
            ref={panelRef}
            id={menuId}
            className="fixed inset-x-4 top-[4.75rem] z-50 overflow-hidden rounded-2xl border border-ds-border bg-white/98 shadow-ds-md backdrop-blur-md sm:inset-x-6"
          >
            <nav aria-label="Seções da página inicial" className="flex flex-col p-2">
              {items.map(({ href, label }) =>
                href.startsWith("#") || href.startsWith("/#") ? (
                  <a
                    key={href}
                    href={href}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ds-ink transition duration-ds ease-out hover:bg-ds-cream"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-xl px-4 py-3 text-base font-medium text-ds-ink transition duration-ds ease-out hover:bg-ds-cream"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                ),
              )}
              <Link
                href="/login"
                className="mt-1 rounded-full bg-ds-accent px-4 py-3 text-center text-base font-semibold text-white transition duration-ds ease-out hover:brightness-95"
                onClick={() => setOpen(false)}
              >
                Começar grátis
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
