"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type JobSearchOption = { id: string; name: string };

export function JobSearchField({
  id,
  jobs,
  disabled,
  initialSelectedJobId,
  onChangeSelectedJobId,
}: {
  id: string;
  jobs: JobSearchOption[];
  disabled?: boolean;
  initialSelectedJobId: string | null;
  onChangeSelectedJobId?: (jobId: string | null) => void;
}) {
  const onChangeRef = useRef(onChangeSelectedJobId);
  onChangeRef.current = onChangeSelectedJobId;

  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedJobId);
  const [query, setQuery] = useState(() => {
    const j = initialSelectedJobId ? jobs.find((x) => x.id === initialSelectedJobId) : null;
    return j?.name ?? "";
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onChangeRef.current?.(selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs.slice(0, 25);
    return jobs.filter((j) => j.name.toLowerCase().includes(q)).slice(0, 40);
  }, [jobs, query]);

  const showList = open && !disabled;

  return (
    <div className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ds-ink">
        Job (opcional)
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelectedId(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 180);
          }}
          placeholder={disabled ? "Selecione um cliente primeiro" : "Buscar job por nome…"}
          className={cn(
            "w-full rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm",
            "focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20",
            disabled && "cursor-not-allowed bg-ds-cream text-ds-subtle"
          )}
        />
        {showList ? (
          <ul
            className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-ds-xl border border-app-border bg-ds-surface py-1 shadow-ds-md"
            role="listbox"
          >
            <li key="__none">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-ds-muted hover:bg-ds-cream"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedId(null);
                  setQuery("");
                  setOpen(false);
                }}
              >
                Sem job
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ds-muted">Nenhum job encontrado.</li>
            ) : (
              filtered.map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-ds-ink hover:bg-ds-cream"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSelectedId(j.id);
                      setQuery(j.name);
                      setOpen(false);
                    }}
                  >
                    {j.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {selectedId ? (
        <button
          type="button"
          className="self-start text-xs text-ds-accent hover:underline"
          onClick={() => {
            setSelectedId(null);
            setQuery("");
          }}
        >
          Limpar job
        </button>
      ) : null}
    </div>
  );
}
