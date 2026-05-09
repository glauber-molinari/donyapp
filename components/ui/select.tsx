"use client";

import { ChevronDown } from "lucide-react";
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

export type SelectOption = { value: string; label: string };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  id: string;
  options: SelectOption[];
  placeholder?: string;
}

function emitChange(
  onChange: SelectProps["onChange"],
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

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      id,
      options,
      placeholder,
      disabled,
      value: valueProp,
      defaultValue,
      onChange,
      onBlur,
      name,
      form,
      required,
      autoComplete,
      ...rest
    },
    ref
  ) => {
    const listboxId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
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
      selectedOption?.label ??
      (placeholder ? placeholder : options[0]?.label ?? "");

    const showPlaceholderStyle = Boolean(placeholder && !selectedOption);

    const commit = useCallback(
      (next: string) => {
        if (disabled) return;
        if (!isControlled) setUncontrolledValue(next);
        emitChange(onChange, next, name);
        setOpen(false);
      },
      [disabled, isControlled, name, onChange]
    );

    useEffect(() => {
      if (!open) return;
      const idx = Math.max(
        0,
        options.findIndex((o) => o.value === currentValue)
      );
      setHighlightIndex(idx >= 0 ? idx : 0);
    }, [open, options, currentValue]);

    useEffect(() => {
      if (!open) return;
      const onDoc = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const handleContainerBlur = (e: FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget as Node | null;
      if (containerRef.current?.contains(next)) return;
      setOpen(false);
      onBlur?.(e as unknown as FocusEvent<HTMLSelectElement>);
    };

    const onKeyDownButton = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === "Escape") {
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        if (e.key === "ArrowDown") {
          setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
        } else {
          setHighlightIndex((i) => Math.max(i - 1, 0));
        }
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const opt = options[highlightIndex];
        if (opt) commit(opt.value);
      }
    };

    const onKeyDownList = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[highlightIndex];
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

    useEffect(() => {
      if (open) {
        queueMicrotask(() => listRef.current?.focus());
      }
    }, [open]);

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-ds-ink">
            {label}
          </label>
        ) : null}

        <div ref={containerRef} className="relative" onBlur={handleContainerBlur}>
          {/* Select nativo para ref, name em formulários e compatibilidade */}
          <select
            {...rest}
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

          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-activedescendant={
              open ? `${id}-opt-${options[highlightIndex]?.value}` : undefined
            }
            aria-describedby={error ? `${id}-error` : undefined}
            onKeyDown={onKeyDownButton}
            onClick={() => !disabled && setOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-3 pr-3 text-left text-sm shadow-sm transition-colors",
              "focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20",
              "disabled:cursor-not-allowed disabled:bg-ds-cream disabled:text-ds-subtle",
              error && "border-red-200 focus:border-red-300 focus:ring-red-200/40",
              showPlaceholderStyle && "text-ds-subtle",
              !showPlaceholderStyle && "text-ds-ink",
              className
            )}
          >
            <span className="min-w-0 truncate">{displayText}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-ds-subtle transition-transform duration-ds ease-out",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {open ? (
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              onKeyDown={onKeyDownList}
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-auto rounded-ds-xl border border-app-border bg-app-sidebar py-1 shadow-ds-md ring-1 ring-ds-ink/5"
            >
              {options.map((opt, i) => {
                const selected = opt.value === currentValue;
                const highlighted = i === highlightIndex;
                return (
                  <div
                    key={opt.value}
                    id={`${id}-opt-${opt.value}`}
                    role="option"
                    aria-selected={selected}
                    data-highlighted={highlighted || undefined}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm outline-none transition-colors",
                      selected && "bg-app-primary/10 font-medium text-ds-ink",
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
                    {opt.label}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {error ? (
          <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
