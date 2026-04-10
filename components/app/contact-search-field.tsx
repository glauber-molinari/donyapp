"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type ContactSearchOption = { id: string; name: string; email: string };

export function ContactSearchField({
  id,
  contacts,
  name = "contact_id",
  hiddenInputId,
  searchInputName,
  defaultContactId,
  disabled,
  resetKey,
  onChangeSelectedId,
}: {
  id: string;
  contacts: ContactSearchOption[];
  name?: string;
  /** id do input hidden (envia contact_id); padrão: `${id}-contact-id` */
  hiddenInputId?: string;
  /** name do campo de texto de busca (não é usado no submit do servidor; só evita aviso de acessibilidade) */
  searchInputName?: string;
  defaultContactId?: string | null;
  disabled?: boolean;
  /** Incrementar ao abrir o modal para limpar o campo */
  resetKey?: number | string;
  onChangeSelectedId?: (contactId: string | null) => void;
}) {
  const resolvedHiddenId = hiddenInputId ?? `${id}-contact-id`;
  const resolvedSearchName = searchInputName ?? `${id}-search`;
  const [selectedId, setSelectedId] = useState<string | null>(defaultContactId ?? null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSelectedId(defaultContactId ?? null);
    const c = contacts.find((x) => x.id === defaultContactId);
    setQuery(c ? `${c.name} (${c.email})` : "");
  }, [defaultContactId, contacts, resetKey]);

  useEffect(() => {
    onChangeSelectedId?.(selectedId);
  }, [onChangeSelectedId, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts.slice(0, 10);
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [contacts, query]);

  return (
    <div className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ds-ink">
        Cliente
      </label>
      <input type="hidden" id={resolvedHiddenId} name={name} value={selectedId ?? ""} />
      <div className="relative">
        <input
          id={id}
          name={resolvedSearchName}
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
          placeholder="Buscar por nome ou e-mail…"
          className={cn(
            "w-full rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm",
            "focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20",
            disabled && "cursor-not-allowed bg-ds-cream text-ds-subtle"
          )}
        />
        {open && query.trim() ? (
          <ul
            className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-ds-xl border border-app-border bg-ds-surface py-1 shadow-ds-md"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ds-muted">Nenhum contato encontrado.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-ds-ink hover:bg-ds-cream"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSelectedId(c.id);
                      setQuery(`${c.name} (${c.email})`);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-xs text-ds-muted">{c.email}</span>
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
          Limpar seleção
        </button>
      ) : null}
    </div>
  );
}
