"use client";

import { X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryPillClass } from "@/lib/notes/note-utils";
import { cn } from "@/lib/utils";

const MAX_TAGS = 16;
const MAX_TAG_LEN = 40;

export function NoteCategoryInput({
  value,
  onChange,
  hiddenInputId,
  draftInputId,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  hiddenInputId: string;
  draftInputId: string;
}) {
  const [draft, setDraft] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const t = raw.trim().slice(0, MAX_TAG_LEN);
      if (!t) return;
      if (value.includes(t)) {
        setDraft("");
        return;
      }
      if (value.length >= MAX_TAGS) return;
      onChange([...value, t]);
      setDraft("");
    },
    [onChange, value]
  );

  function removeTag(tag: string) {
    onChange(value.filter((x) => x !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" id={hiddenInputId} name="categories_json" value={JSON.stringify(value)} readOnly />
      <label htmlFor={draftInputId} className="text-sm font-medium text-ds-ink">
        Categorias
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          id={draftInputId}
          name="category_draft"
          className="sm:flex-1"
          placeholder="Ex.: reunião, briefing, pós-produção…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          aria-label="Adicionar categoria"
        />
        <Button type="button" variant="secondary" size="md" className="w-full shrink-0 sm:w-auto" onClick={() => addTag(draft)}>
          Adicionar
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Categorias da nota">
          {value.map((tag, i) => (
            <li key={tag}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
                  categoryPillClass(tag, i)
                )}
              >
                {tag}
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-black/5"
                  aria-label={`Remover categoria ${tag}`}
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ds-subtle">Nenhuma categoria — opcional.</p>
      )}
    </div>
  );
}
