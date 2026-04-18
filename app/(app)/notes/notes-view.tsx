"use client";

import { MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteNote } from "./actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import {
  categoryPillClass,
  isNotePriority,
  notePriorityLabel,
  notePriorityPillClass,
  snippetFromHtml,
  type NotePriority,
} from "@/lib/notes/note-utils";
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
}

function normalizeOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function NotesView({ notes }: NotesViewProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteNoteRow, setDeleteNoteRow] = useState<NoteWithRelations | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function refresh() {
    router.refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
    const toMs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : null;

    return notes
      .filter((n) => {
        if (!q) return true;
        const contact = normalizeOne(n.contacts);
        const job = normalizeOne(n.jobs);
        const contactName = contact?.name?.toLowerCase() ?? "";
        const contactEmail = contact?.email?.toLowerCase() ?? "";
        const jobName = job?.name?.toLowerCase() ?? "";
        const title = (n.title ?? "").toLowerCase();
        const bodyText = snippetFromHtml(n.content ?? "", 2000).toLowerCase();
        const cats = (n.categories ?? []).map((c) => c.toLowerCase());
        const catMatch = cats.some((c) => c.includes(q));
        return (
          contactName.includes(q) ||
          contactEmail.includes(q) ||
          jobName.includes(q) ||
          title.includes(q) ||
          bodyText.includes(q) ||
          catMatch
        );
      })
      .filter((n) => {
        if (!fromMs && !toMs) return true;
        const dt = Date.parse(n.created_at);
        if (!Number.isFinite(dt)) return true;
        if (fromMs && dt < fromMs) return false;
        if (toMs && dt > toMs) return false;
        return true;
      });
  }, [dateFrom, dateTo, notes, query]);

  async function handleDelete() {
    if (!deleteNoteRow) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await deleteNote(deleteNoteRow.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Nota excluída.");
      setDeleteNoteRow(null);
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">Anotações</h1>
        <Link
          id="btn-nova-nota"
          href="/notes/new"
          className={cn(
            "inline-flex h-10 w-full items-center justify-center gap-2 rounded-ds-xl px-4 text-sm font-medium transition-colors duration-ds ease-out sm:w-auto",
            "bg-app-primary text-white shadow-sm hover:brightness-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nova nota
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
            aria-hidden
          />
          <input
            id="notes-filter-query"
            name="notes_filter_query"
            type="search"
            placeholder="Buscar por cliente, título, categoria…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            aria-label="Buscar anotações"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <label htmlFor="notes-filter-date-from" className="flex flex-col gap-1 text-sm text-ds-muted">
            Data de
            <input
              id="notes-filter-date-from"
              name="notes_filter_date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            />
          </label>
          <label htmlFor="notes-filter-date-to" className="flex flex-col gap-1 text-sm text-ds-muted">
            Data até
            <input
              id="notes-filter-date-to"
              name="notes_filter_date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            />
          </label>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="Nenhuma anotação ainda"
          description="Crie notas para registrar reuniões e detalhes importantes de clientes e jobs."
        >
          <Link
            href="/notes/new"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-ds-xl px-4 text-sm font-medium transition-colors duration-ds ease-out",
              "bg-app-primary text-white shadow-sm hover:brightness-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nova nota
          </Link>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ds-muted">Nenhuma anotação encontrada para “{query.trim()}”.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 overflow-visible sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((n) => {
            const contact = normalizeOne(n.contacts);
            const job = normalizeOne(n.jobs);
            const cats = Array.isArray(n.categories) ? n.categories : [];
            const prRaw = n.priority ?? "none";
            const pr: NotePriority = isNotePriority(prRaw) ? prRaw : "none";
            const dateLabel = new Date(n.created_at).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const titleLine = (n.title ?? "").trim() || "Sem título";
            const snippet = snippetFromHtml(n.content ?? "", 72);

            return (
              <li key={n.id} className="min-w-0 overflow-visible">
                <div
                  className={cn(
                    "relative min-h-0 overflow-visible rounded-xl border border-app-border bg-app-sidebar shadow-ds-sm",
                    "transition duration-ds ease-out hover:border-app-primary/35 hover:shadow-ds-card"
                  )}
                >
                  {/* Camada de clique para abrir a nota — fica atrás do conteúdo */}
                  <Link
                    href={`/notes/${n.id}`}
                    className={cn(
                      "absolute inset-0 z-0 rounded-xl",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
                    )}
                    aria-label={`Abrir nota: ${titleLine}`}
                  />
                  <div className="relative z-[1] flex min-h-0 flex-col gap-1.5 p-3 pointer-events-none">
                    <div className="flex shrink-0 items-start justify-between gap-1.5">
                      <time className="text-[0.65rem] leading-tight text-ds-subtle" dateTime={n.created_at}>
                        {dateLabel}
                      </time>
                      <div className="relative shrink-0 pointer-events-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 bg-app-sidebar p-0 shadow-sm ring-1 ring-app-border hover:bg-ds-cream"
                          aria-label="Menu da nota"
                          aria-haspopup="menu"
                          aria-expanded={menuOpenId === n.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpenId((id) => (id === n.id ? null : n.id));
                          }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        {menuOpenId === n.id ? (
                          <>
                            <button
                              type="button"
                              className="fixed inset-0 z-[200] cursor-default bg-transparent"
                              aria-label="Fechar menu"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div
                              className="absolute right-0 top-full z-[210] mt-1 min-w-[10rem] rounded-ds-xl border border-app-border bg-app-sidebar py-1 shadow-ds-md"
                              role="menu"
                            >
                              <Link
                                href={`/notes/${n.id}`}
                                className="block px-3 py-2 text-sm text-ds-ink hover:bg-ds-cream"
                                role="menuitem"
                                onClick={() => setMenuOpenId(null)}
                              >
                                Abrir / editar
                              </Link>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                role="menuitem"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  setErrorMessage(null);
                                  setDeleteNoteRow(n);
                                }}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                Excluir
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-ds-ink">
                      {titleLine}
                    </h2>
                    <p className="line-clamp-2 text-xs leading-snug text-ds-muted">
                      {snippet || "—"}
                    </p>
                    <div className="flex shrink-0 flex-wrap items-center gap-1 pt-1">
                      {pr !== "none" ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide",
                            notePriorityPillClass(pr)
                          )}
                        >
                          {notePriorityLabel(pr)}
                        </span>
                      ) : null}
                      {cats.slice(0, 2).map((tag, i) => (
                        <span
                          key={`${n.id}-${tag}`}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[0.6rem] font-medium",
                            categoryPillClass(tag, i)
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                      {cats.length > 2 ? (
                        <span className="text-[0.6rem] text-ds-subtle">+{cats.length - 2}</span>
                      ) : null}
                    </div>
                    <p className="truncate text-[0.65rem] leading-tight text-ds-subtle">
                      {contact?.name ?? "Cliente"}
                      {job ? ` · ${job.name}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(deleteNoteRow)}
        onClose={() => setDeleteNoteRow(null)}
        title="Excluir nota"
        size="sm"
      >
        {deleteNoteRow ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ds-muted">
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteNoteRow(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
