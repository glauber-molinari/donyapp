"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FormField } from "@/lib/formularios/types";

interface Props {
  slug: string;
  title: string;
  description: string | null;
  fields: FormField[];
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type Answers = Record<string, string | string[]>;
type Status = "filling" | "submitting" | "success" | "error";

export function FormPublicoClient({ slug, title, description, fields }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<Status>("filling");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const currentField: FormField | undefined = fields[step];
  const isLastStep = step === fields.length - 1;
  const progress = fields.length > 0 ? ((step + 1) / fields.length) * 100 : 100;

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  }, [step]);

  function getAnswer(fieldId: string): string | string[] {
    return answers[fieldId] ?? (currentField?.type === "checkbox" ? [] : "");
  }

  function validate(): boolean {
    if (!currentField) return true;
    const val = answers[currentField.id];
    if (!currentField.required) return true;
    if (currentField.type === "checkbox") {
      if (!Array.isArray(val) || val.length === 0) {
        setFieldError("Selecione ao menos uma opção.");
        return false;
      }
    } else {
      const str = Array.isArray(val) ? val[0] ?? "" : val ?? "";
      if (!str.trim()) {
        setFieldError("Este campo é obrigatório.");
        return false;
      }
    }
    setFieldError(null);
    return true;
  }

  function handleNext() {
    if (!validate()) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
      setFieldError(null);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
      setFieldError(null);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch(`/api/formularios/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && currentField?.type !== "long_text") {
        e.preventDefault();
        handleNext();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentField, step, answers]
  );

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-cream px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-ds-ink">Recebemos suas informações!</h1>
          <p className="text-ds-muted">Obrigado pelo contato. Em breve nossa equipe entrará em toque.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-cream px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-ds-ink">Algo deu errado</h1>
          <p className="mb-6 text-ds-muted">Não conseguimos enviar suas respostas. Tente novamente.</p>
          <button
            type="button"
            onClick={() => setStatus("filling")}
            className="rounded-ds-xl bg-ds-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ds-cream px-4">
        <div className="w-full max-w-lg text-center">
          <h1 className="mb-2 text-2xl font-bold text-ds-ink">{title}</h1>
          <p className="text-ds-muted">Este formulário não possui campos configurados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ds-cream">
      {/* Header com progresso */}
      <header className="sticky top-0 z-10 border-b border-ds-border bg-ds-cream/95 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 py-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-ds-muted">
              {step + 1} / {fields.length}
            </span>
            <span className="text-xs font-medium text-ds-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ds-elevated">
            <div
              className="h-full rounded-full bg-ds-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo do campo */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {step === 0 && (
            <div className="mb-8">
              <h1 className="mb-1 text-3xl font-bold text-ds-ink">{title}</h1>
              {description && <p className="text-ds-muted">{description}</p>}
            </div>
          )}

          <FieldRenderer
            field={currentField}
            value={getAnswer(currentField.id)}
            onChange={(val) => {
              setAnswers((prev) => ({ ...prev, [currentField.id]: val }));
              setFieldError(null);
            }}
            error={fieldError}
            inputRef={inputRef as React.RefObject<HTMLInputElement>}
            onKeyDown={handleKeyDown}
          />

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-ds-xl border border-ds-border px-5 py-2.5 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-elevated hover:text-ds-ink"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={status === "submitting"}
              className="rounded-ds-xl bg-ds-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "submitting"
                ? "Enviando…"
                : isLastStep
                  ? "Enviar"
                  : "Próximo"}
            </button>
            {!isLastStep && (
              <span className="text-xs text-ds-subtle">
                ou pressione <kbd className="rounded border border-ds-border px-1 py-0.5 font-mono text-[10px]">Enter ↵</kbd>
              </span>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <a
          href="https://dony.app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center opacity-70 transition-opacity hover:opacity-100"
          aria-label="Powered by Dony"
        >
          <Image src="/icon.svg" alt="Dony" width={16} height={16} />
        </a>
      </footer>
    </div>
  );
}

interface FieldRendererProps {
  field: FormField;
  value: string | string[];
  onChange: (val: string | string[]) => void;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function FieldRenderer({ field, value, onChange, error, inputRef, onKeyDown }: FieldRendererProps) {
  const strValue = Array.isArray(value) ? "" : value;
  const arrValue = Array.isArray(value) ? value : [];

  const labelEl = (
    <div className="mb-4">
      <p className="text-xl font-semibold text-ds-ink">
        {field.label}
        {field.required && <span className="ml-1 text-ds-accent">*</span>}
      </p>
    </div>
  );

  const baseInputClass =
    "w-full rounded-ds-xl border border-ds-border bg-ds-surface px-4 py-3 text-base text-ds-ink placeholder:text-ds-subtle focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-ds-accent/20 transition-colors";

  if (field.type === "short_text") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Sua resposta"
          autoComplete="off"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "email") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="email"
          inputMode="email"
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="seu@email.com"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "phone") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="tel"
          inputMode="tel"
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(maskPhone(e.target.value))}
          onKeyDown={onKeyDown}
          placeholder="(11) 99999-9999"
          autoComplete="tel"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          inputMode="numeric"
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="0"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "time") {
    return (
      <div>
        {labelEl}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="time"
          step={60}
          className={baseInputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "long_text") {
    return (
      <div>
        {labelEl}
        <textarea
          ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
          className={`${baseInputClass} min-h-[120px] resize-y`}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Sua resposta"
          rows={4}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "multiple_choice") {
    const options = field.options ?? [];
    return (
      <div>
        {labelEl}
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full rounded-ds-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
                strValue === opt
                  ? "border-ds-accent bg-ds-accent/10 text-ds-accent"
                  : "border-ds-border bg-ds-surface text-ds-ink hover:border-ds-accent/50 hover:bg-ds-elevated"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const options = field.options ?? [];
    return (
      <div>
        {labelEl}
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const checked = arrValue.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = checked
                    ? arrValue.filter((v) => v !== opt)
                    : [...arrValue, opt];
                  onChange(next);
                }}
                className={`flex w-full items-center gap-3 rounded-ds-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
                  checked
                    ? "border-ds-accent bg-ds-accent/10 text-ds-accent"
                    : "border-ds-border bg-ds-surface text-ds-ink hover:border-ds-accent/50 hover:bg-ds-elevated"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    checked ? "border-ds-accent bg-ds-accent" : "border-ds-border"
                  }`}
                >
                  {checked && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return null;
}
