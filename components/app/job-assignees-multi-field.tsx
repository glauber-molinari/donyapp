"use client";

import { UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { JobAssigneePickerOption } from "@/lib/build-job-assignee-picker-options";
import { cn } from "@/lib/utils";

export type JobAssigneesMultiFieldProps = {
  id: string;
  /** Nome do campo no FormData (vários valores com o mesmo name). */
  name: string;
  label: string;
  options: JobAssigneePickerOption[];
  defaultSelectedTokens: string[];
  /** Quando há mais de uma opção, exige pelo menos um selecionado (validação no envio). */
  requireSelection: boolean;
  disabled?: boolean;
};

/* Mesmo padrão visual de `tasks-view` (AvatarCircle + cores). */
const AVATAR_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
];

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]![0] ?? "?").toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase();
}

function avatarColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function AvatarCircle({
  name,
  email,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-xs";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-white", sz)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white",
        sz
      )}
      style={{ backgroundColor: avatarColor(email) }}
      title={name}
    >
      {nameInitials(name)}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

export function JobAssigneesMultiField({
  id,
  name,
  label,
  options,
  defaultSelectedTokens,
  requireSelection,
  disabled,
}: JobAssigneesMultiFieldProps) {
  const searchId = `${id}-search`;

  const optionByToken = useMemo(() => {
    const m = new Map<string, JobAssigneePickerOption>();
    for (const o of options) m.set(o.token, o);
    return m;
  }, [options]);

  const validTokens = useMemo(() => new Set(options.map((o) => o.token)), [options]);
  const safeDefaults = useMemo(() => {
    const d = defaultSelectedTokens.filter((t) => validTokens.has(t));
    if (d.length > 0) return d;
    if (options.length === 1) return [options[0]!.token];
    return [];
  }, [defaultSelectedTokens, validTokens, options]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(safeDefaults));
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  /** Evita reset a cada render quando o pai passa `defaultSelectedTokens` como array novo com o mesmo conteúdo. */
  const defaultsSyncKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const d = defaultSelectedTokens.filter((t) => validTokens.has(t));
    const resolved =
      d.length > 0 ? d : options.length === 1 && options[0] ? [options[0].token] : [];
    const key = `${[...options.map((o) => o.token)].sort().join("\0")}\0${[...resolved].sort().join("\0")}`;
    if (defaultsSyncKeyRef.current === key) return;
    defaultsSyncKeyRef.current = key;
    setSelected(new Set(resolved));
    setQuery("");
    setPickerOpen(false);
  }, [defaultSelectedTokens, validTokens, options]);

  function addToken(token: string) {
    if (disabled || !validTokens.has(token)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(token);
      return next;
    });
    setPickerOpen(false);
    setQuery("");
  }

  function removeToken(token: string) {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(token);
      return next;
    });
  }

  const selectedArr = Array.from(selected);

  const availableFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => {
      if (selected.has(o.token)) return false;
      if (!q) return true;
      return (
        o.label.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
      );
    });
  }, [options, query, selected]);

  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-ds-border bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-amber-900/90">
          Não há responsáveis cadastrados nem usuários na conta para listar aqui.
        </p>
      </div>
    );
  }

  return (
    <fieldset disabled={disabled} className="m-0 min-w-0 w-full border-0 p-0">
      <legend className="sr-only">{label}</legend>
      {selectedArr.map((token) => (
        <input key={token} type="hidden" name={name} value={token} />
      ))}

      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0 max-w-[13rem] min-w-[7rem] pt-1 pr-2 text-sm font-medium leading-snug text-ds-ink">
          {label}
          {requireSelection ? (
            <>
              {"\u00A0"}
              <span className="text-red-400">*</span>
            </>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          {selectedArr.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedArr.map((token) => {
                const o = optionByToken.get(token);
                if (!o) return null;
                return (
                  <div
                    key={token}
                    className="flex items-center gap-1.5 rounded-full border border-ds-border bg-white px-2 py-1"
                  >
                    <AvatarCircle name={o.label} email={o.email} avatarUrl={o.avatarUrl} />
                    <span className="max-w-[100px] truncate text-xs text-ds-ink">{o.label}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeToken(token)}
                      className="ml-0.5 text-ds-muted-2 hover:text-red-500"
                      aria-label={`Remover ${o.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {pickerOpen ? (
            <div className="flex flex-col gap-2">
              <input
                id={searchId}
                autoFocus
                type="text"
                autoComplete="off"
                disabled={disabled}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou e-mail…"
                className={inputCls}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setPickerOpen(false);
                    setQuery("");
                  }
                }}
              />
              <div className="max-h-44 overflow-y-auto rounded-lg border border-ds-border bg-white [scrollbar-width:thin]">
                {availableFiltered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-ds-muted-2">
                    {options.length === 0
                      ? "Nenhum membro ou responsável cadastrado."
                      : "Nenhuma pessoa encontrada."}
                  </p>
                ) : (
                  availableFiltered.map((o) => (
                    <button
                      key={o.token}
                      type="button"
                      disabled={disabled}
                      onClick={() => addToken(o.token)}
                      className="flex w-full items-center gap-3 border-b border-ds-border/40 px-3 py-2.5 text-left last:border-0 hover:bg-ds-cream/80 disabled:opacity-60"
                    >
                      <AvatarCircle name={o.label} email={o.email} avatarUrl={o.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ds-ink">{o.label}</p>
                        <p className="truncate text-[11px] text-ds-muted-2">{o.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  setQuery("");
                }}
                className="self-start text-xs text-ds-muted-2 hover:text-ds-ink"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 text-xs text-ds-muted-2 hover:text-ds-accent"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Adicionar pessoa da equipe
            </button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
