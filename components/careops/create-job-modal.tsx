"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

type CreateJobTab = "info" | "prazos";

const STAGE_OPTIONS = [
  { value: "backup", label: "Backup" },
  { value: "edicao", label: "Em Edição" },
  { value: "aprovacao", label: "Em Aprovação" },
];

const WORK_TYPE_OPTIONS = [
  { value: "casamento", label: "Casamento" },
  { value: "ensaio", label: "Ensaio" },
  { value: "aniversario", label: "Aniversário" },
  { value: "corporativo", label: "Corporativo" },
];

const CONTACT_OPTIONS = [
  { value: "ana", label: "Ana Souza" },
  { value: "carla", label: "Carla Mendes" },
  { value: "lucas", label: "Lucas Lima" },
  { value: "helena", label: "Helena Dias" },
];

const TEAM_OPTIONS = [
  { value: "glauber", label: "Glauber Molinari" },
  { value: "lara", label: "Lara Ribeiro" },
  { value: "ana-m", label: "Ana Martins" },
];

const fieldCls =
  "w-full rounded-full border border-ds-border bg-ds-cream/50 px-3.5 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

const selectCls =
  "w-full rounded-full border border-ds-border bg-ds-cream/50 px-3.5 py-2.5 text-sm text-ds-ink focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

const textareaCls =
  "w-full rounded-[1rem] border border-ds-border bg-ds-cream/50 px-3.5 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ds-muted">
        {label}
        {required ? <span className="ml-0.5 text-ds-danger">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-ds-muted-2">{hint}</p> : null}
    </div>
  );
}

export function CreateJobModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [tab, setTab] = useState<CreateJobTab>("info");
  const [deliveryType, setDeliveryType] = useState<"foto" | "video" | "foto_video">(
    "foto"
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab("info");
    setDeliveryType("foto");
    setSavedFlash(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleSave() {
    setSavedFlash(true);
    window.setTimeout(() => {
      setSavedFlash(false);
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-ds-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] border border-ds-border/70 bg-ds-surface shadow-ds-pop sm:rounded-[1.5rem]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ds-border/60 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ds-muted-2">
              Preview
            </p>
            <h2
              id={titleId}
              className="mt-0.5 font-display text-xl font-bold tracking-tight text-ds-ink"
            >
              Novo job
            </h2>
            <p className="mt-1 text-xs text-ds-muted">
              Fluxo em duas etapas — só visual, sem gravar no banco.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div
            className="mb-4 inline-flex w-full rounded-full border border-ds-border bg-ds-cream/50 p-1"
            role="tablist"
            aria-label="Seções do formulário"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "info"}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                tab === "info"
                  ? "bg-ds-ink text-ds-on-dark shadow-sm"
                  : "text-ds-muted hover:text-ds-ink"
              )}
              onClick={() => setTab("info")}
            >
              Informações
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "prazos"}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                tab === "prazos"
                  ? "bg-ds-ink text-ds-on-dark shadow-sm"
                  : "text-ds-muted hover:text-ds-ink"
              )}
              onClick={() => setTab("prazos")}
            >
              Prazos e entrega
            </button>
          </div>

          {tab === "info" ? (
            <div className="flex flex-col gap-3.5" role="tabpanel">
              <div className="rounded-[1.125rem] border border-ds-border/70 bg-ds-cream/30 p-4">
                <div className="flex flex-col gap-3.5">
                  <Field label="Status inicial" htmlFor="preview-stage" required>
                    <select id="preview-stage" className={selectCls} defaultValue="backup">
                      {STAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Data do trabalho"
                    htmlFor="preview-job-date"
                    hint="Data em que ocorreu a sessão de fotos ou a gravação."
                  >
                    <input
                      id="preview-job-date"
                      type="date"
                      className={fieldCls}
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                  <Field label="Nome do job" htmlFor="preview-name" required>
                    <input
                      id="preview-name"
                      type="text"
                      className={fieldCls}
                      placeholder="Ex.: Casamento Ana & Pedro"
                      defaultValue=""
                    />
                  </Field>
                  <Field label="Contato" htmlFor="preview-contact">
                    <select id="preview-contact" className={selectCls} defaultValue="">
                      <option value="">Buscar ou selecionar…</option>
                      {CONTACT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tipo do job" htmlFor="preview-work-type" required>
                    <select
                      id="preview-work-type"
                      className={selectCls}
                      defaultValue="casamento"
                    >
                      {WORK_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Cartão SD"
                    htmlFor="preview-sd"
                    hint="Opcional. Ex.: 001"
                  >
                    <input
                      id="preview-sd"
                      type="text"
                      className={fieldCls}
                      placeholder="Número do cartão"
                    />
                  </Field>
                  <Field label="Observações" htmlFor="preview-notes">
                    <textarea
                      id="preview-notes"
                      rows={3}
                      className={textareaCls}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5" role="tabpanel">
              <div className="rounded-[1.125rem] border border-ds-border/70 bg-ds-cream/30 p-4">
                <div className="flex flex-col gap-3.5">
                  <Field label="Prazo interno" htmlFor="preview-internal" required>
                    <input
                      id="preview-internal"
                      type="date"
                      className={fieldCls}
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                  <Field label="Prazo final" htmlFor="preview-deadline" required>
                    <input
                      id="preview-deadline"
                      type="date"
                      className={fieldCls}
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-[1.125rem] border border-ds-border/70 bg-ds-cream/30 p-4">
                <div className="flex flex-col gap-3.5">
                  <Field label="Tipo de entrega" htmlFor="preview-delivery" required>
                    <select
                      id="preview-delivery"
                      className={selectCls}
                      value={deliveryType}
                      onChange={(e) =>
                        setDeliveryType(
                          e.target.value as "foto" | "video" | "foto_video"
                        )
                      }
                    >
                      <option value="foto">Foto</option>
                      <option value="video">Vídeo</option>
                      <option value="foto_video">Foto e Vídeo</option>
                    </select>
                  </Field>

                  {deliveryType !== "video" ? (
                    <Field label="Equipe de foto" htmlFor="preview-photo-team">
                      <select
                        id="preview-photo-team"
                        className={selectCls}
                        defaultValue="glauber"
                      >
                        {TEAM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}

                  {deliveryType !== "foto" ? (
                    <Field label="Equipe de vídeo" htmlFor="preview-video-team">
                      <select
                        id="preview-video-team"
                        className={selectCls}
                        defaultValue="lara"
                      >
                        {TEAM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}

                  <Field
                    label="Link de entrega"
                    htmlFor="preview-link"
                    hint="Opcional. Drive, WeTransfer, etc."
                  >
                    <input
                      id="preview-link"
                      type="url"
                      className={fieldCls}
                      placeholder="https://"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {savedFlash ? (
            <p
              className="mt-4 rounded-full border border-ds-success/20 bg-ds-success-soft px-4 py-2 text-center text-sm font-medium text-ds-success"
              role="status"
            >
              Job criado no preview (não salvo de verdade).
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-ds-border/60 bg-ds-cream/20 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
          >
            Fechar
          </button>
          {tab === "info" ? (
            <button
              type="button"
              onClick={() => setTab("prazos")}
              className="inline-flex h-10 items-center justify-center rounded-full bg-ds-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-[#e94c00]"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center rounded-full bg-ds-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-[#e94c00]"
            >
              Salvar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
