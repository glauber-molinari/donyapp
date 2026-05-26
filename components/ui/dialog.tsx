"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Descrição opcional exibida abaixo do título */
  description?: string;
  children?: React.ReactNode;
  /** Área de ações — Button primary à direita, "Cancelar" ghost à esquerda */
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ds-ink/40 p-4 backdrop-blur-[2px]"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className={cn(
            "relative flex w-full max-w-[440px] flex-col overflow-hidden",
            "rounded-ds-2xl border border-ds-hairline bg-ds-surface shadow-ds-pop",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-base font-semibold text-ds-ink">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="text-sm text-ds-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="mt-0.5 shrink-0 rounded-ds-md p-1.5 text-ds-muted transition-colors duration-ds-fast hover:bg-ds-cream hover:text-ds-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {children ? (
            <div className="px-6 pb-6">
              {children}
            </div>
          ) : null}

          {/* Footer */}
          {footer ? (
            <div className="flex items-center justify-between gap-3 border-t border-ds-hairline bg-ds-cream px-6 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/**
 * Variante destrutiva: exibe o nome do objeto sendo destruído em negrito
 * dentro do body, conforme regra DS.
 */
export interface DestructiveDialogProps extends Omit<DialogProps, "children"> {
  /** Nome do objeto a ser destruído — será repetido em negrito no corpo */
  objectName: string;
  /** Texto explicativo da consequência */
  consequence?: string;
}

export function DestructiveDialog({
  objectName,
  consequence = "Esta ação não pode ser desfeita.",
  ...props
}: DestructiveDialogProps) {
  return (
    <Dialog {...props}>
      <p className="text-sm text-ds-ink-2">
        Você está prestes a excluir <strong className="text-ds-ink">{objectName}</strong>.{" "}
        {consequence}
      </p>
    </Dialog>
  );
}
