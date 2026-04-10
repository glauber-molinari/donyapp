"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createNote, updateNote } from "./actions";
import { ContactSearchField } from "@/components/app/contact-search-field";
import { NoteBodyEditor } from "@/components/app/note-body-editor";
import { NoteCategoryInput } from "@/components/app/note-category-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import {
  isNotePriority,
  normalizeNoteContentForEditor,
  notePriorityLabel,
  type NotePriority,
} from "@/lib/notes/note-utils";
import type { Database } from "@/types/database";

export type ContactOption = Pick<
  Database["public"]["Tables"]["contacts"]["Row"],
  "id" | "name" | "email"
>;

export type JobOption = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  "id" | "name" | "contact_id"
>;

export interface NoteEditorInitial {
  contact_id: string;
  job_id: string | null;
  title: string | null;
  content: string;
  categories: string[] | null;
  priority: string | null;
}

interface NoteEditorClientProps {
  mode: "create" | "edit";
  noteId?: string;
  initial?: NoteEditorInitial | null;
  contacts: ContactOption[];
  jobs: JobOption[];
}

export function NoteEditorClient({ mode, noteId, initial, contacts, jobs }: NoteEditorClientProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [contactId, setContactId] = useState<string | null>(initial?.contact_id ?? null);
  const [jobId, setJobId] = useState<string | null>(initial?.job_id ?? null);
  const [categories, setCategories] = useState<string[]>(
    Array.isArray(initial?.categories) ? initial!.categories! : []
  );
  const [priority, setPriority] = useState<NotePriority>(
    initial?.priority && isNotePriority(initial.priority) ? initial.priority : "none"
  );

  const initialHtml = useMemo(
    () => normalizeNoteContentForEditor(initial?.content ?? ""),
    [initial?.content]
  );
  const [contentHtml, setContentHtml] = useState(initialHtml);

  const editorKey = mode === "edit" && noteId ? noteId : "new";

  const jobsForContact = useMemo(() => {
    if (!contactId) return [];
    return jobs.filter((j) => j.contact_id === contactId);
  }, [contactId, jobs]);

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
        router.push(`/notes/${res.id}`);
        router.refresh();
        return;
      }

      if (!noteId) {
        setErrorMessage("Nota inválida.");
        return;
      }
      const res = await updateNote(noteId, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Nota salva.");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const heading = mode === "create" ? "Nova nota" : title.trim() || "Editar nota";

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-ds-muted" aria-label="Navegação">
        <Link href="/notes" className="font-medium text-app-primary hover:underline">
          Anotações
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <span className="truncate text-ds-ink">{heading}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">{heading}</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => router.push("/notes")}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            form="note-editor-form"
            size="md"
            className="inline-flex w-full gap-2 sm:w-auto"
            disabled={isPending}
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
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      <form id="note-editor-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="rounded-ds-xl border border-app-border bg-app-sidebar p-4 shadow-ds-card sm:p-6">
          <div className="flex flex-col gap-5">
            <Input
              id="note-editor-title"
              name="title"
              label="Título"
              placeholder="Sem título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <ContactSearchField
                id="note-editor-contact"
                contacts={contacts}
                defaultContactId={initial?.contact_id ?? null}
                resetKey={editorKey}
                onChangeSelectedId={(id) => {
                  setContactId(id);
                  setJobId(null);
                }}
              />

              <label htmlFor="note-editor-job" className="flex flex-col gap-1.5 text-sm font-medium text-ds-ink">
                Job (opcional)
                <select
                  id="note-editor-job"
                  name="job_id"
                  value={jobId ?? ""}
                  onChange={(e) => setJobId(e.target.value ? e.target.value : null)}
                  disabled={!contactId}
                  className="w-full rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20 disabled:cursor-not-allowed disabled:bg-ds-cream disabled:text-ds-subtle"
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

            <div className="grid gap-5 lg:grid-cols-2">
              <NoteCategoryInput
                value={categories}
                onChange={setCategories}
                hiddenInputId="note-editor-categories-json"
                draftInputId="note-editor-category-draft"
              />

              <label htmlFor="note-editor-priority" className="flex flex-col gap-1.5 text-sm font-medium text-ds-ink">
                Prioridade
                <select
                  id="note-editor-priority"
                  name="priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(isNotePriority(e.target.value) ? e.target.value : "none")
                  }
                  className="w-full rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
                >
                  {(["none", "low", "medium", "high"] as const).map((p) => (
                    <option key={p} value={p}>
                      {notePriorityLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ds-ink">Conteúdo</span>
              <NoteBodyEditor
                id="note-editor-body"
                editorKey={editorKey}
                initialHtml={initialHtml}
                onHtmlChange={setContentHtml}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
