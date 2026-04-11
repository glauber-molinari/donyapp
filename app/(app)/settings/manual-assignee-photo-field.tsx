"use client";

import { ImageUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Reset interno ao trocar registro (ex.: id do responsável na edição). */
  resetKey?: string;
  /** URL já salva (edição). */
  existingUrl?: string | null;
  disabled?: boolean;
  /** Se true, envia `clear_photo=1` ao remover. */
  showClearHidden?: boolean;
  className?: string;
};

/**
 * Campo de arquivo para foto do responsável manual. Usa `name="photo"` e opcionalmente `clear_photo`.
 */
export function ManualAssigneePhotoField({
  resetKey,
  existingUrl,
  disabled,
  showClearHidden = false,
  className,
}: Props) {
  const baseId = useId();
  const inputId = `${baseId}-photo`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);

  useEffect(() => {
    setBlobUrl(null);
    setRemoveRequested(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [resetKey]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const displaySrc = removeRequested ? null : blobUrl ?? existingUrl ?? null;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRemoveRequested(false);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  function onRemove() {
    setRemoveRequested(true);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-sm font-medium text-ds-ink">Foto (opcional)</span>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-ds-xl border border-ds-border bg-ds-cream"
          aria-hidden={!displaySrc}
        >
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview local ou URL pública
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-ds-muted">Sem foto</div>
          )}
        </div>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled}
          onChange={onPick}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={() => fileRef.current?.click()}
        >
          <ImageUp className="h-4 w-4 shrink-0" aria-hidden />
          {displaySrc ? "Trocar foto" : "Enviar foto"}
        </Button>
        {(displaySrc || (existingUrl && !removeRequested)) && !removeRequested ? (
          <button
            type="button"
            className="text-xs font-medium text-ds-muted underline-offset-2 hover:text-ds-ink hover:underline"
            disabled={disabled}
            onClick={onRemove}
          >
            Remover
          </button>
        ) : null}
        {showClearHidden ? (
          <input type="hidden" name="clear_photo" value={removeRequested ? "1" : "0"} />
        ) : null}
      </div>
      <p className="text-xs text-ds-muted">JPG, PNG, WebP ou GIF. Até 2,5 MB.</p>
    </div>
  );
}
