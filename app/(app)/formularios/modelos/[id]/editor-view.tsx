"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { FormField, FormTemplate } from "@/lib/formularios/types";
import type { FormFieldType } from "@/types/database";

interface Props {
  template: FormTemplate | null;
}

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Texto curto",
  long_text: "Texto longo",
  email: "E-mail",
  phone: "Telefone",
  number: "Número",
  date: "Data",
  multiple_choice: "Múltipla escolha",
  checkbox: "Caixas de seleção",
};

const FIELD_TYPE_OPTIONS: FormFieldType[] = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "number",
  "date",
  "multiple_choice",
  "checkbox",
];

function defaultField(): FormField {
  return {
    id: crypto.randomUUID(),
    type: "short_text",
    label: "",
    required: false,
    options: [],
  };
}

export function EditorView({ template }: Props) {
  const router = useRouter();
  const isNew = template === null;

  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [active, setActive] = useState(template?.active ?? true);
  const [fields, setFields] = useState<FormField[]>(template?.fields ?? []);
  const [isPending, setIsPending] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (isNew) setSlug(slugify(val));
  }

  function validateSlug(val: string): boolean {
    if (!/^[a-z0-9-]+$/.test(val)) {
      setSlugError("Use apenas letras minúsculas, números e hífens.");
      return false;
    }
    setSlugError(null);
    return true;
  }

  // Field operations
  function addField() {
    setFields((prev) => [...prev, defaultField()]);
  }

  function updateField(idx: number, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function removeField(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= fields.length) return;
    setFields((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function duplicateField(idx: number) {
    setFields((prev) => {
      const arr = [...prev];
      const copy = { ...arr[idx], id: crypto.randomUUID() };
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
  }

  function updateOption(fieldIdx: number, optIdx: number, val: string) {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIdx) return f;
        const opts = [...(f.options ?? [])];
        opts[optIdx] = val;
        return { ...f, options: opts };
      })
    );
  }

  function addOption(fieldIdx: number) {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIdx ? { ...f, options: [...(f.options ?? []), ""] } : f
      )
    );
  }

  function removeOption(fieldIdx: number, optIdx: number) {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIdx
          ? { ...f, options: (f.options ?? []).filter((_, oi) => oi !== optIdx) }
          : f
      )
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Informe o título do formulário.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Informe o slug.");
      return;
    }
    if (!validateSlug(slug)) return;

    for (const f of fields) {
      if (!f.label.trim()) {
        toast.error("Todos os campos precisam ter um label.");
        return;
      }
    }

    setIsPending(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        slug: slug.trim(),
        active,
        fields,
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/formularios/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/formularios/templates/${template!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar.");
        return;
      }

      toast.success(isNew ? "Formulário criado!" : "Formulário salvo!");
      router.push("/formularios/modelos");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar formulário.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/formularios/modelos">
          <button
            type="button"
            className="rounded-ds-xl p-2 text-ds-muted hover:bg-ds-elevated hover:text-ds-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-ds-ink">
          {isNew ? "Novo modelo" : "Editar modelo"}
        </h1>
      </div>

      {/* Dados do formulário */}
      <section className="mb-6 space-y-4 rounded-ds-xl border border-ds-border bg-ds-surface p-5">
        <h2 className="text-sm font-semibold text-ds-ink">Informações gerais</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-ds-ink">
            Título <span className="text-ds-accent">*</span>
          </label>
          <Input
            id="form-template-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ex: Orçamento Fotografia de Casamento"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ds-ink">Descrição</label>
          <Textarea
            id="form-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva brevemente o formulário (opcional)"
            rows={2}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ds-ink">
            Slug <span className="text-ds-accent">*</span>
          </label>
          <Input
            id="form-template-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              validateSlug(e.target.value);
            }}
            placeholder="orcamento-casamento"
            className={slugError ? "border-red-400" : ""}
          />
          {slugError ? (
            <p className="mt-1 text-xs text-red-500">{slugError}</p>
          ) : slug ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-ds-muted">
              Link público:
              <a
                href={`/formulario/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-ds-accent hover:underline"
              >
                {appUrl}/formulario/{slug}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/30 ${active ? "bg-green-500" : "bg-ds-elevated"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
          <span className="text-sm text-ds-muted">
            {active ? "Formulário ativo" : "Formulário inativo"}
          </span>
        </div>
      </section>

      {/* Campos */}
      <section className="mb-6 rounded-ds-xl border border-ds-border bg-ds-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ds-ink">Campos do formulário</h2>
          <Button size="sm" variant="secondary" onClick={addField}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar campo
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-ds-muted">
            Nenhum campo adicionado. Clique em &quot;Adicionar campo&quot; para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <FieldCard
                key={field.id}
                field={field}
                idx={idx}
                total={fields.length}
                onUpdate={(patch) => updateField(idx, patch)}
                onRemove={() => removeField(idx)}
                onMoveUp={() => moveField(idx, -1)}
                onMoveDown={() => moveField(idx, 1)}
                onDuplicate={() => duplicateField(idx)}
                onUpdateOption={(optIdx, val) => updateOption(idx, optIdx, val)}
                onAddOption={() => addOption(idx)}
                onRemoveOption={(optIdx) => removeOption(idx, optIdx)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Link href="/formularios/modelos">
          <Button variant="ghost">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar formulário"}
        </Button>
      </div>
    </div>
  );
}

interface FieldCardProps {
  field: FormField;
  idx: number;
  total: number;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onUpdateOption: (optIdx: number, val: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optIdx: number) => void;
}

function FieldCard({
  field,
  idx,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
}: FieldCardProps) {
  const hasOptions = field.type === "multiple_choice" || field.type === "checkbox";

  return (
    <div className="rounded-xl border border-ds-border bg-ds-elevated/40 p-4">
      <div className="mb-3 flex items-start gap-2">
        <div className="mt-1 flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={idx === 0}
            className="rounded p-0.5 text-ds-subtle hover:bg-ds-elevated disabled:opacity-30"
            title="Mover para cima"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={idx === total - 1}
            className="rounded p-0.5 text-ds-subtle hover:bg-ds-elevated disabled:opacity-30"
            title="Mover para baixo"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`form-template-field-${field.id}-label`}
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Label do campo"
              className="flex-1"
            />
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as FormFieldType })}
              className="rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-ink focus:border-ds-accent focus:outline-none sm:w-44"
            >
              {FIELD_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {hasOptions && (
            <div className="space-y-1.5 pl-1">
              {(field.options ?? []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Input
                    id={`form-template-field-${field.id}-option-${oi}`}
                    value={opt}
                    onChange={(e) => onUpdateOption(oi, e.target.value)}
                    placeholder={`Opção ${oi + 1}`}
                    className="flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveOption(oi)}
                    className="rounded p-1 text-ds-subtle hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddOption}
                className="flex items-center gap-1 text-xs font-medium text-ds-accent hover:underline"
              >
                <Plus className="h-3 w-3" />
                Adicionar opção
              </button>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ds-muted">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="h-4 w-4 rounded border-ds-border accent-ds-accent"
            />
            Campo obrigatório
          </label>
        </div>

        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar"
            className="rounded p-1.5 text-ds-subtle hover:bg-ds-elevated hover:text-ds-ink"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Excluir"
            className="rounded p-1.5 text-ds-subtle hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
