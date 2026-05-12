"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { InlineNoteEditor } from "./inline-note-editor";
import { EmptyState } from "@/components/ui/empty-state";
import { categoryPillClass, formatNoteDate, snippetFromHtml } from "@/lib/notes/note-utils";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

export type ContactOption = Pick<
  Database["public"]["Tables"]["contacts"]["Row"],
  "id" | "name" | "email"
>;

export type JobOption = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  "id" | "name" | "contact_id"
>;

export type NoteRow = Database["public"]["Tables"]["contact_notes"]["Row"];

export type NoteWithRelations = NoteRow & {
  contacts?: ContactOption | ContactOption[] | null;
  jobs?: JobOption | JobOption[] | null;
};

interface NotesViewProps {
  notes: NoteWithRelations[];
  contacts: ContactOption[];
  jobs: JobOption[];
}

function normalizeOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

type PanelMode = "idle" | "create" | "edit";

export function NotesView({ notes, contacts, jobs }: NotesViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [panelMode, setPanelMode] = useState<PanelMode>("idle");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);

  const isOpen = panelMode !== "idle";

  const selectedNote = useMemo(
    () => (selectedNoteId ? (notes.find((n) => n.id === selectedNoteId) ?? null) : null),
    [notes, selectedNoteId]
  );

  // After creating a note, switch to edit mode once it appears in the refreshed list
  useEffect(() => {
    if (!pendingNoteId) return;
    const found = notes.find((n) => n.id === pendingNoteId);
    if (found) {
      setSelectedNoteId(found.id);
      setPanelMode("edit");
      setPendingNoteId(null);
    }
  }, [notes, pendingNoteId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const contact = normalizeOne(n.contacts);
      const job = normalizeOne(n.jobs);
      const cats = (n.categories ?? []).map((c) => c.toLowerCase());
      return (
        (contact?.name?.toLowerCase() ?? "").includes(q) ||
        (contact?.email?.toLowerCase() ?? "").includes(q) ||
        (job?.name?.toLowerCase() ?? "").includes(q) ||
        (n.title ?? "").toLowerCase().includes(q) ||
        snippetFromHtml(n.content ?? "", 2000).toLowerCase().includes(q) ||
        cats.some((c) => c.includes(q))
      );
    });
  }, [notes, query]);

  function handleSelectNote(n: NoteWithRelations) {
    setSelectedNoteId(n.id);
    setPanelMode("edit");
  }

  function handleNewNote() {
    setSelectedNoteId(null);
    setPanelMode("create");
  }

  function handleSaved(noteId: string) {
    if (panelMode === "create") {
      setPendingNoteId(noteId);
    }
    router.refresh();
  }

  function handleDeleted() {
    setSelectedNoteId(null);
    setPanelMode("idle");
    router.refresh();
  }

  const editorKey = panelMode === "create" ? "create" : selectedNoteId ?? "idle";

  return (
    <div
      className={cn(
        isOpen
          ? "flex h-[calc(100dvh-7rem)] overflow-hidden rounded-ds-xl border border-ds-border bg-ds-surface shadow-ds-card md:h-[calc(100dvh-7rem)]"
          : "flex flex-col gap-6"
      )}
    >
      {/* ── Left column / full grid ──────────────────────────── */}
      <div
        className={cn(
          isOpen
            ? "hidden w-[260px] shrink-0 flex-col overflow-hidden border-r border-ds-border md:flex"
            : "flex flex-col gap-6"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            isOpen && "shrink-0 border-b border-ds-border px-4 py-3"
          )}
        >
          <h1 className={cn("font-bold text-ds-ink", isOpen ? "text-sm" : "text-2xl")}>
            Anotações
          </h1>
          <button
            type="button"
            onClick={handleNewNote}
            aria-label="Nova nota"
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-ds-xl font-medium transition-colors ease-out",
              "bg-app-primary text-white shadow-sm hover:brightness-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35",
              isOpen
                ? "h-8 px-2.5 text-xs"
                : "h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {!isOpen && <span className="whitespace-nowrap">Nova nota</span>}
          </button>
        </div>

        {/* Search */}
        <div className={cn(isOpen ? "shrink-0 border-b border-ds-border p-2" : "max-w-md")}>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
              aria-hidden
            />
            <input
              type="search"
              placeholder={isOpen ? "Buscar…" : "Buscar por cliente, título, categoria…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-ds-xl border border-app-border bg-ds-cream/60 py-2 pl-9 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
              aria-label="Buscar anotações"
            />
          </div>
        </div>

        {/* Cards */}
        {notes.length === 0 ? (
          <EmptyState
            title="Nenhuma anotação ainda"
            description="Crie notas para registrar reuniões e detalhes importantes de clientes e jobs."
          >
            <button
              type="button"
              onClick={handleNewNote}
              className="inline-flex h-10 items-center gap-2 rounded-ds-xl bg-app-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nova nota
            </button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <p className={cn("text-sm text-ds-muted", isOpen ? "px-4 py-3" : "")}>
            Nenhuma anotação encontrada.
          </p>
        ) : isOpen ? (
          /* ── Column view ─────────────────────────────────────── */
          <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {filtered.map((n) => {
              const cats = Array.isArray(n.categories) ? n.categories : [];
              const titleLine = (n.title ?? "").trim() || "Sem título";
              const snippet = snippetFromHtml(n.content ?? "", 60);
              const dateLabel = formatNoteDate(n.updated_at ?? n.created_at);
              const isActive = selectedNoteId === n.id;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-ds-xl border px-3 py-2.5 text-left transition-all duration-150",
                      isActive
                        ? "border-ds-accent/40 bg-ds-accent/5"
                        : "border-transparent hover:border-ds-border hover:bg-ds-cream"
                    )}
                    onClick={() => handleSelectNote(n)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {cats[0] ? (
                        <span
                          className={cn(
                            "max-w-[55%] truncate rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide",
                            categoryPillClass(cats[0], 0)
                          )}
                        >
                          {cats[0]}
                        </span>
                      ) : (
                        <span />
                      )}
                      <time className="shrink-0 text-[0.6rem] text-ds-subtle">{dateLabel}</time>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-ds-ink">
                      {titleLine}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[0.7rem] text-ds-muted">
                      {snippet || "—"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          /* ── Grid view ───────────────────────────────────────── */
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((n) => {
              const cats = Array.isArray(n.categories) ? n.categories : [];
              const titleLine = (n.title ?? "").trim() || "Sem título";
              const snippet = snippetFromHtml(n.content ?? "", 80);
              const dateLabel = formatNoteDate(n.updated_at ?? n.created_at);
              return (
                <li key={n.id} className="min-w-0">
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-[160px] w-full flex-col gap-2 rounded-ds-2xl border border-ds-border bg-ds-surface p-4 text-left shadow-ds-sm",
                      "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-ds-accent/25 hover:shadow-ds-card",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/25"
                    )}
                    onClick={() => handleSelectNote(n)}
                  >
                    {cats[0] ? (
                      <span
                        className={cn(
                          "self-start rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide",
                          categoryPillClass(cats[0], 0)
                        )}
                      >
                        {cats[0]}
                      </span>
                    ) : (
                      <span className="h-5" />
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ds-ink">
                        {titleLine}
                      </h2>
                      <p className="line-clamp-2 text-xs leading-snug text-ds-muted">
                        {snippet || "—"}
                      </p>
                    </div>
                    <time className="text-[0.65rem] text-ds-subtle">{dateLabel}</time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Right panel: inline editor ─────────────────────────
           Mobile: ocupa a tela inteira (oculta a lista).
           Desktop: painel lateral ao lado da lista. */}
      {isOpen && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <InlineNoteEditor
            key={editorKey}
            mode={panelMode === "create" ? "create" : "edit"}
            note={panelMode === "edit" ? selectedNote : null}
            contacts={contacts}
            jobs={jobs}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onClose={() => setPanelMode("idle")}
          />
        </div>
      )}
    </div>
  );
}
