"use client";

import { ThumbsUp, Lightbulb } from "lucide-react";
import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

import { submitFeedback, toggleVote } from "./actions";

export type FeedbackStage = "em_estudo" | "faremos" | "produzindo" | "pronto";

export interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  stage: FeedbackStage;
  vote_count: number;
  user_voted: boolean;
}

interface FeedbackViewProps {
  suggestions: Suggestion[];
}

const STAGES: { key: FeedbackStage; label: string }[] = [
  { key: "em_estudo", label: "Em estudo" },
  { key: "faremos", label: "Faremos" },
  { key: "produzindo", label: "Produzindo" },
  { key: "pronto", label: "Pronto" },
];

export function FeedbackView({ suggestions }: FeedbackViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const grouped = STAGES.reduce<Record<FeedbackStage, Suggestion[]>>(
    (acc, { key }) => {
      acc[key] = suggestions.filter((s) => s.stage === key);
      return acc;
    },
    { em_estudo: [], faremos: [], produzindo: [], pronto: [] }
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await submitFeedback(fd);
      if (res.ok) {
        toast.success("Sugestão enviada! Ela ficará visível após aprovação.");
        form.reset();
        setModalOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleVote(id: string) {
    startTransition(async () => {
      const res = await toggleVote(id);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-ink">Quadro de Sugestões</h1>
          <p className="mt-0.5 text-sm text-ds-muted">
            Veja o que estamos construindo e vote nas ideias que mais importam para você.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="mt-3 shrink-0 sm:mt-0">
          <Lightbulb className="h-4 w-4" />
          Enviar sugestão
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAGES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2">
              <span className="text-sm font-semibold text-ds-ink">{label}</span>
              <span className="rounded-full bg-ds-cream px-2 py-0.5 text-xs font-medium text-ds-muted">
                {grouped[key].length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {grouped[key].length === 0 ? (
                <div className="rounded-ds-xl border border-dashed border-app-border px-4 py-6 text-center text-xs text-ds-subtle">
                  Nenhuma sugestão ainda
                </div>
              ) : (
                grouped[key].map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    onVote={() => handleVote(s.id)}
                    disabled={isPending}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>


      {/* Modal de nova sugestão */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enviar sugestão"
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-title" className="text-sm font-medium text-ds-ink">
              Título <span className="text-red-500">*</span>
            </label>
            <Input
              id="fb-title"
              name="title"
              placeholder="Resumo da sua ideia em poucas palavras"
              maxLength={120}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fb-desc" className="text-sm font-medium text-ds-ink">
              Descrição <span className="text-ds-subtle text-xs font-normal">(opcional)</span>
            </label>
            <Textarea
              id="fb-desc"
              name="description"
              placeholder="Explique melhor sua ideia, o problema que resolve, etc."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando…" : "Enviar sugestão"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onVote,
  disabled,
}: {
  suggestion: Suggestion;
  onVote: () => void;
  disabled: boolean;
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-ds-xl border border-app-border bg-app-sidebar p-4 transition-shadow hover:shadow-ds-sm">
      <p className="text-sm font-medium leading-snug text-ds-ink">{suggestion.title}</p>
      {suggestion.description && (
        <p className="line-clamp-3 text-xs leading-relaxed text-ds-muted">
          {suggestion.description}
        </p>
      )}
      <div className="mt-1 flex items-center justify-end">
        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          aria-label={suggestion.user_voted ? "Remover voto" : "Votar nesta sugestão"}
          className={`flex items-center gap-1.5 rounded-ds-xl px-2.5 py-1 text-xs font-medium transition-colors duration-ds ease-out disabled:opacity-60 ${
            suggestion.user_voted
              ? "bg-app-primary/10 text-app-primary"
              : "border border-app-border text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {suggestion.vote_count}
        </button>
      </div>
    </div>
  );
}

