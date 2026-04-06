"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { resetTour } from "@/lib/onboarding/tour-actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function ProfileTourReset() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReset() {
    setMessage(null);
    setPending(true);
    try {
      const res = await resetTour();
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      toast.success("Tour reativado. Recarregue a página para ver de novo.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-ds-xl border border-app-border bg-app-sidebar p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-ds-ink">Tour guiado</h3>
      <p className="mt-1 text-sm text-ds-muted">
        Ao recarregar a página, o tour será exibido de novo (sidebar, contatos, quadro e resumo das
        configurações).
      </p>
      {message ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="button" variant="secondary" className="mt-3" disabled={pending} onClick={handleReset}>
        {pending ? "Salvando…" : "Refazer o tour"}
      </Button>
    </div>
  );
}
