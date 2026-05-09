"use client";

import { Loader2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { createNote, deleteNote, updateNote } from "./actions";
import { ContactSearchField } from "@/components/app/contact-search-field";
import { NoteBodyEditor } from "@/components/app/note-body-editor";
import { NoteCategoryInput } from "@/components/app/note-category-input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import {
  formatNoteDate,
  isNotePriority,
  normalizeNoteContentForEditor,
  type NotePriority,
} from "@/lib/notes/note-utils";
import { cn } from "@/lib/utils";
import type { ContactOption, JobOption, NoteWithRelations } from "./notes-view";

function normalizeOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

interface InlineNoteEditorProps {
  mode: "create" | "edit";
  note: NoteWithRelations | null;
  contacts: ContactOption[];
  jobs: JobOption[];
  onSaved: (noteId: string) => void;
  onDeleted: () => void;
  onClose: () => void;
}

export function InlineNoteEditor({
  mode,
  note,
  contacts,
  jobs,
  onSaved,
  onDeleted,
  onClose,
}: InlineNoteEditorProps) {
  const contact = normalizeOne(note?.contacts);
  const job = normalizeOne(note?.jobs);
  const editorKey = note?.id ?? "new";

  const [title, setTitle] = useState(note?.title ?? "");
  const [contactId, setContactId] = useState<string | null>(note?.contact_id ?? null);
  const [jobId, setJobId] = useState<string | null>(note?.job_id ?? null);
  const [categories, setCategories] = useState<string[]>(
    Array.isArray(note?.categories) ? (note!.categories as string[]) : []
  );
  const [priority] = useState<NotePriority>(
    note?.priority && isNotePriority(note.priority) ? note.priority : "none"
  );
  const initialHtml = normalizeNoteContentForEditor(note?.content ?? "");
  const [contentHtml, setContentHtml] = useState(initialHtml);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const jobsForContact = useMemo(
    () => (contactId ? jobs.filter((j) => j.contact_id === contactId) : []),
    [contactId, jobs]
  );

  const dateLabel = formatNoteDate(note?.updated_at ?? note?.created_at);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    if (!contactId) {
      setErrorMessage("Selecione um cliente.");
      return;
    }
    setIsPending(true);
    try {
      const fd = new FormData();
      fd.set("contact_id", contactId);
      fd.set("job_id", jobId ?? "");
      fd.set("title", title.trim());
      fd.set("content", contentHtml);
      fd.set("categories_json", JSON.stringify(categories));
      fd.set("priority", priority);

      if (mode === "create") {
        const res = await createNote(fd);
        if (!res.ok) {
          setErrorMessage(res.error);
          return;
        }
        toast.success("Nota criada.");
        onSaved(res.id);
        return;
      }

      if (!note?.id) {
        setErrorMessage("Nota inválida.");
        return;
      }
      const res = await updateNote(note.id, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Nota salva.");
      onSaved(note.id);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!note?.id) return;
    setIsDeletePending(true);
    try {
      const res = await deleteNote(note.id);
      if (!res.ok) {
        toast.error(res.error ?? "Erro ao excluir.");
        return;
      }
      toast.success("Nota excluída.");
      setShowDeleteModal(false);
      onDeleted();
    } finally {
      setIsDeletePending(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-ds-border px-6 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {mode === "edit" && contact ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-ds-muted">
              <Link
                href={`/contacts/${note?.contact_id}`}
                className="font-medium text-ds-accent hover:underline"
              >
                {contact.name}
              </Link>
              {job ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="truncate">{job.name}</span>
                </>
              ) : null}
              {dateLabel ? <span className="text-ds-subtle">{dateLabel}</span> : null}
            </div>
          ) : mode === "edit" && dateLabel ? (
            <span className="text-xs text-ds-subtle">{dateLabel}</span>
          ) : (
            <span className="text-xs font-medium text-ds-muted">Nova anotação</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {mode === "edit" && note?.id ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ds-subtle transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Excluir nota"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ds-subtle transition-colors hover:bg-ds-cream hover:text-ds-ink"
            aria-label="Fechar editor"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────── */}
      <form
        id="inline-note-form"
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        {/* Title */}
        <div className="shrink-0 border-b border-ds-border px-6 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sem título"
            className="w-full bg-transparent text-2xl font-bold text-ds-ink placeholder:text-ds-elevated-soft focus:outline-none"
            aria-label="Título da nota"
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Meta fields */}
          <div className="grid gap-4 border-b border-ds-border py-4 sm:grid-cols-2">
            <ContactSearchField
              id="inline-note-contact"
              contacts={contacts}
              defaultContactId={note?.contact_id ?? null}
              resetKey={editorKey}
              onChangeSelectedId={(id) => {
                setContactId(id);
                setJobId(null);
              }}
            />
            <label
              htmlFor="inline-note-job"
              className="flex flex-col gap-1.5 text-sm font-medium text-ds-ink"
            >
              Job (opcional)
              <select
                id="inline-note-job"
                value={jobId ?? ""}
                onChange={(e) => setJobId(e.target.value || null)}
                disabled={!contactId}
                className="w-full rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20 disabled:cursor-not-allowed disabled:bg-ds-cream disabled:text-ds-subtle"
              >
                <option value="">Sem job</option>
                {jobsForContact.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="border-b border-ds-border py-4">
            <NoteCategoryInput
              value={categories}
              onChange={setCategories}
              hiddenInputId="inline-note-categories-json"
              draftInputId="inline-note-category-draft"
            />
          </div>

          {/* Editor */}
          <div className="py-4">
            {errorMessage ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {errorMessage}
              </div>
            ) : null}
            <NoteBodyEditor
              id="inline-note-body"
              editorKey={editorKey}
              initialHtml={initialHtml}
              onHtmlChange={setContentHtml}
              className="min-h-[14rem]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-ds-border px-6 py-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="md"
            disabled={isPending}
            className={cn("inline-flex gap-2", isPending && "opacity-70")}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir nota"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ds-muted">
            Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeletePending}
            >
              {isDeletePending ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
