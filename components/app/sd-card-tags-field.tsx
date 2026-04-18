"use client";

import { X } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

const MAX_TAGS = 20;
const MAX_TAG_LEN = 80;

export type SdCardTagsFieldProps = {
  id: string;
  /** Nome enviado no FormData (vários hidden com o mesmo nome). */
  name?: string;
  label: string;
  hint?: string;
  initialTags?: string[];
};

function normalizeInitial(tags: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags ?? []) {
    const t = raw.trim().slice(0, MAX_TAG_LEN);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function splitInputPieces(s: string): string[] {
  return s
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function SdCardTagsField({
  id,
  name = "sd_card_tags",
  label,
  hint,
  initialTags,
}: SdCardTagsFieldProps) {
  const [tags, setTags] = useState<string[]>(() => normalizeInitial(initialTags));
  const [draft, setDraft] = useState("");

  const addPieces = useCallback((pieces: string[]) => {
    setTags((prev) => {
      const next = [...prev];
      const seen = new Set(next);
      for (const p of pieces) {
        const t = p.slice(0, MAX_TAG_LEN);
        if (!t || seen.has(t)) continue;
        seen.add(t);
        next.push(t);
        if (next.length >= MAX_TAGS) break;
      }
      return next;
    });
  }, []);

  const commitDraft = useCallback(() => {
    const pieces = splitInputPieces(draft);
    if (pieces.length === 0) return;
    addPieces(pieces);
    setDraft("");
  }, [addPieces, draft]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      setTags((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ds-ink">
        {label}
      </label>
      {tags.map((tag, i) => (
        <input key={`${name}-h-${i}-${tag}`} type="hidden" name={name} value={tag} />
      ))}
      <div
        className={cn(
          "flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-ds-xl border border-app-border bg-app-sidebar px-2 py-2 shadow-sm",
          "focus-within:border-app-primary/50 focus-within:ring-2 focus-within:ring-app-primary/20"
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-ds-cream px-2 py-1 text-sm text-ds-ink"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-ds-muted hover:bg-ds-cream/80 hover:text-ds-ink"
              aria-label={`Remover tag ${tag}`}
              onClick={() => setTags((prev) => prev.filter((x) => x !== tag))}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder={tags.length ? "Outro cartão…" : "Ex.: 001 ou CARTÃO 1"}
          autoComplete="off"
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-ds-ink outline-none placeholder:text-ds-subtle"
        />
      </div>
      {hint ? <p className="text-xs text-ds-muted">{hint}</p> : null}
    </div>
  );
}
