"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NoteBodyEditor({
  id,
  editorKey,
  initialHtml,
  onHtmlChange,
}: {
  id: string;
  /** Muda ao trocar de nota — reaplica o HTML inicial sem depender de cada tecla. */
  editorKey: string;
  initialHtml: string;
  onHtmlChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = initialHtml.trim() ? initialHtml : "<p><br></p>";
    el.innerHTML = html;
  }, [editorKey, initialHtml]);

  function exec(cmd: "bold" | "italic" | "underline") {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false);
    onHtmlChange(el.innerHTML);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1 rounded-ds-xl border border-app-border bg-ds-cream/60 p-1.5"
        role="toolbar"
        aria-label="Formatação do texto"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec("bold")}
          aria-label="Negrito"
        >
          <Bold className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec("italic")}
          aria-label="Itálico"
        >
          <Italic className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec("underline")}
          aria-label="Sublinhado"
        >
          <Underline className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div
        ref={ref}
        id={id}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "min-h-[min(60vh,28rem)] w-full rounded-ds-xl border border-app-border bg-app-sidebar px-4 py-4 text-sm leading-relaxed text-ds-ink shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-app-primary/20",
          "[&_a]:text-ds-accent-ink [&_a]:underline"
        )}
        onInput={() => {
          if (ref.current) onHtmlChange(ref.current.innerHTML);
        }}
        role="textbox"
        aria-multiline="true"
        aria-label="Corpo da nota"
      />
    </div>
  );
}
