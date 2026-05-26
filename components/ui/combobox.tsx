"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

export interface ComboboxProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
}

function emitChange(
  onChange: ComboboxProps["onChange"],
  value: string,
  name: string | undefined
) {
  if (!onChange) return;
  const synthetic = {
    target: { value, name: name ?? "" },
    currentTarget: { value, name: name ?? "" },
  } as ChangeEvent<HTMLSelectElement>;
  onChange(synthetic);
}

export const Combobox = forwardRef<HTMLSelectElement, ComboboxProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      options,
      placeholder,
      searchPlaceholder = "Buscar…",
      disabled,
      value: valueProp,
      defaultValue,
      onChange,
      onBlur,
      name,
      form,
      required,
      autoComplete,
    },
    ref
  ) => {
    const listboxId = useId();
    const searchId = useId();
    const hintId = useId();
    const errorId = useId();

    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);

    const isControlled = valueProp !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(
      () => defaultValue?.toString() ?? ""
    );
    const currentValue = isControlled ? String(valueProp ?? "") : uncontrolledValue;

    const selectedOption = useMemo(
      () => options.find((o) => o.value === currentValue),
      [options, currentValue]
    );

    const displayText =
      selectedOption?.label ?? (placeholder ? placeholder : options[0]?.label ?? "");
    const showPlaceholderStyle = Boolean(placeholder && !selectedOption);

    const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return options;
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, search]);

    const commit = useCallback(
      (next: string) => {
        if (disabled) return;
        if (!isControlled) setUncontrolledValue(next);
        emitChange(onChange, next, name);
        setOpen(false);
        setSearch("");
      },
      [disabled, isControlled, name, onChange]
    );

    const close = useCallback(() => {
      setOpen(false);
      setSearch("");
    }, []);

    useEffect(() => {
      if (open) setHighlightIndex(0);
    }, [open, filtered.length]);

    useEffect(() => {
      if (!open) return;
      const onDoc = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) close();
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [open, close]);

    useEffect(() => {
      if (open) {
        queueMicrotask(() => searchRef.current?.focus());
      }
    }, [open]);

    const handleContainerBlur = (e: FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget as Node | null;
      if (containerRef.current?.contains(next)) return;
      close();
      onBlur?.(e as unknown as FocusEvent<HTMLSelectElement>);
    };

    const onKeyDownTrigger = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === "Escape") {
        if (open) { e.preventDefault(); close(); }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
    };

    const onKeyDownSearch = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        listRef.current?.focus();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const opt = filtered[highlightIndex];
        if (opt) commit(opt.value);
      }
    };

    const onKeyDownList = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (highlightIndex === 0) { searchRef.current?.focus(); return; }
        setHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = filtered[highlightIndex];
        if (opt) commit(opt.value);
      }
    };

    const setRefs = useCallback(
      (node: HTMLSelectElement | null) => {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-ds-ink">
            {label}
          </label>
        ) : null}

        <div ref={containerRef} className="relative" onBlur={handleContainerBlur}>
          {/* Hidden native select for form compatibility */}
          <select
            ref={setRefs}
            id={`${id}-native`}
            name={name}
            form={form}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            value={currentValue}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
            onChange={() => {}}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Trigger */}
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-describedby={describedBy}
            onKeyDown={onKeyDownTrigger}
            onClick={() => !disabled && setOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-ds-lg border border-ds-border bg-ds-surface py-2.5 pl-3 pr-3 text-left text-sm",
              "transition-[border-color,box-shadow] duration-ds-fast ease-out",
              "focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-[rgba(255,85,0,0.18)]",
              "disabled:cursor-not-allowed disabled:bg-ds-cream disabled:text-ds-muted",
              error && "border-ds-danger focus:border-ds-danger focus:ring-[rgba(196,56,56,0.18)]",
              showPlaceholderStyle ? "text-ds-muted-2" : "text-ds-ink",
              className
            )}
          >
            <span className="min-w-0 truncate">{displayText}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-ds-muted-2 transition-transform duration-ds ease-out",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {/* Dropdown */}
          {open ? (
            <div
              id={listboxId}
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-ds-lg border border-ds-border bg-ds-surface shadow-ds-md"
            >
              {/* Search input */}
              <div className="flex items-center gap-2 border-b border-ds-hairline px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-ds-muted-2" aria-hidden />
                <input
                  ref={searchRef}
                  id={searchId}
                  type="text"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  onKeyDown={onKeyDownSearch}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none"
                />
              </div>

              {/* Options list */}
              <div
                ref={listRef}
                role="listbox"
                tabIndex={-1}
                onKeyDown={onKeyDownList}
                className="max-h-56 overflow-auto py-1"
              >
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-ds-muted">Nenhum resultado.</p>
                ) : (
                  filtered.map((opt, i) => {
                    const selected = opt.value === currentValue;
                    const highlighted = i === highlightIndex;
                    return (
                      <div
                        key={opt.value}
                        id={`${id}-opt-${opt.value}`}
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          "flex cursor-pointer items-center justify-between px-3 py-2 text-sm outline-none transition-colors duration-ds-fast",
                          selected && "bg-ds-accent-soft font-medium text-ds-ink",
                          !selected && "text-ds-ink",
                          highlighted && !selected && "bg-ds-cream",
                          !highlighted && !selected && "hover:bg-ds-cream"
                        )}
                        onMouseEnter={() => setHighlightIndex(i)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          commit(opt.value);
                        }}
                      >
                        <span className="min-w-0 truncate">{opt.label}</span>
                        {selected ? (
                          <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-ds-accent" aria-hidden />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        {hint && !error ? (
          <p id={hintId} className="text-xs text-ds-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-xs text-ds-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";
