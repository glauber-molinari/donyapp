"use client";

import { ArrowRight, ArrowLeft, Plus, Trash2, X, Check } from "lucide-react";
import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

import { createCard, deleteCard, moveCard, type RoadmapCard, type RoadmapColumn } from "./actions";

const COLUMNS: { id: RoadmapColumn; label: string; color: string }[] = [
  { id: "ideia", label: "Ideia", color: "bg-violet-100 text-violet-800" },
  { id: "executando", label: "Executando", color: "bg-amber-100 text-amber-800" },
  { id: "aplicado", label: "Aplicado", color: "bg-green-100 text-green-800" },
];

const COLUMN_ORDER: RoadmapColumn[] = ["ideia", "executando", "aplicado"];

interface Props {
  cards: RoadmapCard[];
}

export function RoadmapView({ cards: initialCards }: Props) {
  const [cards, setCards] = useState(initialCards);

  function groupedCards(col: RoadmapColumn) {
    return cards.filter((c) => c.column === col).sort((a, b) => a.position - b.position);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Roadmap</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Kanban privado para organizar ideias e funcionalidades.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={groupedCards(col.id)}
            onCardCreated={(card) => setCards((prev) => [...prev, card])}
            onCardMoved={(id, newCol) =>
              setCards((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, column: newCol, position: Date.now() } : c
                )
              )
            }
            onCardDeleted={(id) => setCards((prev) => prev.filter((c) => c.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnProps {
  column: (typeof COLUMNS)[number];
  cards: RoadmapCard[];
  onCardCreated: (card: RoadmapCard) => void;
  onCardMoved: (id: string, col: RoadmapColumn) => void;
  onCardDeleted: (id: string) => void;
}

function KanbanColumn({ column, cards, onCardCreated, onCardMoved, onCardDeleted }: ColumnProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-app-canvas p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${column.color}`}>
            {column.label}
          </span>
          <span className="text-xs text-ds-muted">{cards.length}</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-ds-lg text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
          aria-label="Adicionar card"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {showForm && (
        <AddCardForm
          column={column.id}
          onCreated={(card) => {
            onCardCreated(card);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex flex-col gap-2">
        {cards.length === 0 && !showForm && (
          <p className="py-4 text-center text-xs text-ds-subtle">Nenhum card ainda.</p>
        )}
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onMoved={onCardMoved}
            onDeleted={onCardDeleted}
          />
        ))}
      </div>
    </div>
  );
}

function AddCardForm({
  column,
  onCreated,
  onCancel,
}: {
  column: RoadmapColumn;
  onCreated: (card: RoadmapCard) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const res = await createCard(title, description, column);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const newCard: RoadmapCard = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || null,
        column,
        position: Date.now(),
        created_at: new Date().toISOString(),
      };
      onCreated(newCard);
      toast.success("Card criado!");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-ds-xl border border-app-border bg-app-sidebar p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full rounded-ds-lg border border-app-border bg-app-canvas px-3 py-1.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/25"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        rows={2}
        className="w-full resize-none rounded-ds-lg border border-app-border bg-app-canvas px-3 py-1.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/25"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending || !title.trim()} className="gap-1.5">
          <Check className="h-3.5 w-3.5" />
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function KanbanCard({
  card,
  onMoved,
  onDeleted,
}: {
  card: RoadmapCard;
  onMoved: (id: string, col: RoadmapColumn) => void;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const colIndex = COLUMN_ORDER.indexOf(card.column);
  const prevCol = colIndex > 0 ? COLUMN_ORDER[colIndex - 1] : null;
  const nextCol = colIndex < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[colIndex + 1] : null;

  function handleMove(col: RoadmapColumn) {
    startTransition(async () => {
      const res = await moveCard(card.id, col);
      if (!res.ok) toast.error(res.error);
      else onMoved(card.id, col);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCard(card.id);
      if (!res.ok) toast.error(res.error);
      else onDeleted(card.id);
    });
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-ds-xl border border-app-border bg-app-sidebar p-3 transition-opacity ${isPending ? "opacity-50" : ""}`}
    >
      <p className="text-sm font-semibold leading-snug text-ds-ink">{card.title}</p>
      {card.description && (
        <p className="text-xs leading-relaxed text-ds-muted">{card.description}</p>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1">
          {prevCol && (
            <button
              onClick={() => handleMove(prevCol)}
              disabled={isPending}
              className="flex h-6 w-6 items-center justify-center rounded text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink disabled:cursor-not-allowed"
              aria-label="Mover para coluna anterior"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {nextCol && (
            <button
              onClick={() => handleMove(nextCol)}
              disabled={isPending}
              className="flex h-6 w-6 items-center justify-center rounded text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink disabled:cursor-not-allowed"
              aria-label="Mover para próxima coluna"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex h-6 w-6 items-center justify-center rounded text-ds-subtle transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed"
          aria-label="Excluir card"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
