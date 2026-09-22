"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { useOnboardingTour } from "@/components/app/onboarding-tour";
import { Button } from "@/components/ui/button";
import { markLifetimeWelcomeSeen } from "@/lib/subscriptions/lifetime-welcome";
import { toast } from "@/lib/toast";

export function LifetimeProWelcome({
  initialOpen,
  onDismissed,
}: {
  initialOpen: boolean;
  onDismissed?: () => void;
}) {
  const tour = useOnboardingTour();
  const titleId = useId();
  const descId = useId();
  const [open, setOpen] = useState(initialOpen);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const dismissedRef = useRef(false);
  const startTourAfterClose = useRef(false);

  useEffect(() => {
    if (initialOpen && !dismissedRef.current) setOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void finish(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open || !startTourAfterClose.current) return;
    startTourAfterClose.current = false;
    const id = window.setTimeout(() => tour?.startTour(), 40);
    return () => window.clearTimeout(id);
  }, [open, tour]);

  async function finish(startTour: boolean) {
    if (!open || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    const result = await markLifetimeWelcomeSeen();
    if (!result.ok) {
      pendingRef.current = false;
      setPending(false);
      toast.error("Não deu para salvar. Tenta fechar de novo.");
      return;
    }
    dismissedRef.current = true;
    startTourAfterClose.current = startTour;
    setOpen(false);
    onDismissed?.();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ds-ink/40 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) void finish(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-[420px] rounded-[28px] border border-ds-hairline bg-white px-7 pb-7 pt-8 shadow-ds-pop"
      >
        <Image
          src="/marketing/mulher-celular.png"
          alt=""
          width={1050}
          height={615}
          priority
          className="mx-auto h-auto w-full max-w-[320px]"
        />

        <h2 id={titleId} className="mt-2 text-center text-xl font-bold tracking-tight text-ds-ink">
          Você é Pro vitalício
        </h2>
        <p id={descId} className="mx-auto mt-2 max-w-[32ch] text-center text-sm leading-relaxed text-ds-muted">
          Parabéns. Esse acesso não tem data para acabar. O tour mostra onde fica cada ferramenta.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-xl bg-white"
            disabled={pending}
            onClick={() => void finish(false)}
          >
            Fechar
          </Button>
          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={pending}
            onClick={() => void finish(true)}
          >
            Fazer Tour
          </Button>
        </div>
      </div>
    </div>
  );
}
