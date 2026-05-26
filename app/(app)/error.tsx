"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[app]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4 rounded-ds-xl border border-ds-danger/20 bg-ds-danger-soft p-6">
      <h2 className="text-lg font-semibold text-ds-danger">Algo deu errado nesta área</h2>
      <p className="text-sm text-ds-danger">
        Não foi possível carregar o conteúdo. Verifique sua conexão e tente de novo.
      </p>
      <Button type="button" variant="secondary" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
