"use client";

import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Mic,
  MicOff,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { useVoiceTranscription } from "@/lib/hooks/use-voice-transcription";
import { cn } from "@/lib/utils";

export function NoteBodyEditor({
  id,
  editorKey,
  initialHtml,
  onHtmlChange,
  className,
}: {
  id: string;
  /** Muda ao trocar de nota — reaplica o HTML inicial sem depender de cada tecla. */
  editorKey: string;
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isSupported, isRecording, interimText, errorMessage, start, stop } =
    useVoiceTranscription();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = initialHtml.trim() ? initialHtml : "<p><br></p>";
    el.innerHTML = html;
  }, [editorKey, initialHtml]);

  function exec(cmd: string, value?: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, value);
    onHtmlChange(el.innerHTML);
  }

  function insertLink() {
    const url = window.prompt("URL do link (https://…)");
    if (url == null || url.trim() === "") return;
    const normalized = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    exec("createLink", normalized);
  }

  /** Evita que o botão roube o foco do contentEditable; sem isso a seleção some e listas/execCommand falham. */
  function keepEditorSelectionOnToolbarPointer(e: MouseEvent) {
    e.preventDefault();
  }

  function handleFinalText(text: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand("insertText", false, text + " ");
    onHtmlChange(el.innerHTML);
  }

  function toggleRecording() {
    if (isRecording) {
      stop();
    } else {
      ref.current?.focus();
      start(handleFinalText);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1 rounded-ds-lg border border-ds-border bg-ds-cream/60 p-1.5"
        role="toolbar"
        aria-label="Formatação do texto"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
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
          onMouseDown={keepEditorSelectionOnToolbarPointer}
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
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={() => exec("underline")}
          aria-label="Sublinhado"
        >
          <Underline className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={() => exec("strikeThrough")}
          aria-label="Riscado"
        >
          <Strikethrough className="h-4 w-4" aria-hidden />
        </Button>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-ds-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={() => exec("insertUnorderedList")}
          aria-label="Lista com marcadores"
        >
          <List className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={() => exec("insertOrderedList")}
          aria-label="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </Button>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-ds-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={insertLink}
          aria-label="Inserir link"
        >
          <Link2 className="h-4 w-4" aria-hidden />
        </Button>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-ds-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={keepEditorSelectionOnToolbarPointer}
          onClick={toggleRecording}
          disabled={!isSupported}
          title={
            !isSupported
              ? "Seu browser não suporta gravação de voz. Use Chrome ou Edge."
              : isRecording
                ? "Parar gravação"
                : "Gravar voz (pt-BR)"
          }
          aria-label={isRecording ? "Parar gravação de voz" : "Gravar voz"}
          aria-pressed={isRecording}
          className={cn(
            "h-8 gap-1.5 px-2 text-xs",
            isRecording && "animate-pulse bg-red-100 text-red-600 hover:bg-red-100 hover:text-red-600",
          )}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Mic className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {isRecording ? "Parar" : "Voz"}
        </Button>
      </div>
      {isRecording && interimText ? (
        <div className="flex items-center gap-1.5 rounded-ds-lg border border-ds-border bg-ds-cream/60 px-3 py-1.5 text-xs italic text-ds-muted">
          <Mic className="h-3 w-3 shrink-0 text-red-500" aria-hidden />
          <span className="truncate">{interimText}</span>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="flex items-center gap-1.5 rounded-ds-lg border border-ds-danger/20 bg-ds-danger-soft px-3 py-1.5 text-xs text-ds-danger">
          <MicOff className="h-3 w-3 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : null}
      <div
        ref={ref}
        id={id}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "min-h-[min(60vh,28rem)] w-full rounded-ds-lg border border-ds-border bg-ds-surface px-4 py-4 text-sm leading-relaxed text-ds-ink shadow-ds-sm",
          "focus:outline-none focus:ring-2 focus:ring-ds-accent/20",
          "[&_a]:text-ds-accent-ink [&_a]:underline",
          // Preflight do Tailwind remove list-style; sem isso ul/ol ficam invisiveis.
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-7",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-7",
          "[&_li]:my-0.5",
          className
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
