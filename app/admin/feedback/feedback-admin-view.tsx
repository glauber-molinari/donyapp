"use client";

import { Check, X, ChevronDown } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

import { approveSuggestion, rejectSuggestion, updateStage } from "./actions";

export type SuggestionStatus = "pending" | "approved" | "rejected";
export type SuggestionStage = "em_estudo" | "faremos" | "produzindo" | "pronto";

export interface AdminSuggestion {
  id: string;
  title: string;
  description: string | null;
  status: SuggestionStatus;
  stage: SuggestionStage | null;
  vote_count: number;
  created_at: string;
  user_email: string | null;
}

interface FeedbackAdminViewProps {
  pending: AdminSuggestion[];
  approved: AdminSuggestion[];
  rejected: AdminSuggestion[];
}

const STAGES: { value: SuggestionStage; label: string }[] = [
  { value: "em_estudo", label: "Em estudo" },
  { value: "faremos", label: "Faremos" },
  { value: "produzindo", label: "Produzindo" },
  { value: "pronto", label: "Pronto" },
];

export function FeedbackAdminView({ pending, approved, rejected }: FeedbackAdminViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Sugestões de usuários</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Revise, aprove ou rejeite sugestões e controle o estágio de cada uma.
        </p>
      </div>

      {/* Pendentes */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ds-ink">Aguardando análise</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-ds-muted">Nenhuma sugestão pendente.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((s) => (
              <PendingCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}
      </section>

      {/* Aprovadas */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ds-ink">Aprovadas</h3>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {approved.length}
          </span>
        </div>

        {approved.length === 0 ? (
          <p className="text-sm text-ds-muted">Nenhuma sugestão aprovada ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {approved.map((s) => (
              <ApprovedCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}
      </section>

      {/* Rejeitadas */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ds-ink">Rejeitadas</h3>
          <span className="rounded-full bg-ds-cream px-2 py-0.5 text-xs font-medium text-ds-muted">
            {rejected.length}
          </span>
        </div>

        {rejected.length === 0 ? (
          <p className="text-sm text-ds-muted">Nenhuma sugestão rejeitada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rejected.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-4 rounded-ds-xl border border-app-border bg-app-sidebar px-4 py-3 opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ds-ink">{s.title}</p>
                  {s.user_email && (
                    <p className="text-xs text-ds-muted">{s.user_email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PendingCard({ suggestion }: { suggestion: AdminSuggestion }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const res = await approveSuggestion(suggestion.id);
      if (res.ok) toast.success("Sugestão aprovada!");
      else toast.error(res.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectSuggestion(suggestion.id);
      if (res.ok) toast.success("Sugestão rejeitada.");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-app-sidebar p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ds-ink">{suggestion.title}</p>
          {suggestion.description && (
            <p className="mt-1 text-xs leading-relaxed text-ds-muted">{suggestion.description}</p>
          )}
          {suggestion.user_email && (
            <p className="mt-1.5 text-xs text-ds-subtle">{suggestion.user_email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleReject}
          disabled={isPending}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Rejeitar
        </Button>
      </div>
    </div>
  );
}

function ApprovedCard({ suggestion }: { suggestion: AdminSuggestion }) {
  const [isPending, startTransition] = useTransition();

  function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const stage = e.target.value as SuggestionStage;
    startTransition(async () => {
      const res = await updateStage(suggestion.id, stage);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectSuggestion(suggestion.id);
      if (res.ok) toast.success("Sugestão movida para rejeitadas.");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-ds-xl border border-app-border bg-app-sidebar p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ds-ink">{suggestion.title}</p>
        {suggestion.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-ds-muted">{suggestion.description}</p>
        )}
        {suggestion.user_email && (
          <p className="mt-1 text-xs text-ds-subtle">{suggestion.user_email}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-ds-muted">
          {suggestion.vote_count} voto{suggestion.vote_count !== 1 ? "s" : ""}
        </span>

        <div className="relative">
          <select
            value={suggestion.stage ?? "em_estudo"}
            onChange={handleStageChange}
            disabled={isPending}
            className="h-8 appearance-none rounded-ds-xl border border-app-border bg-app-canvas pl-3 pr-7 text-xs font-medium text-ds-ink transition-colors focus:outline-none focus:ring-2 focus:ring-app-primary/25 disabled:opacity-60"
          >
            {STAGES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ds-muted" />
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={isPending}
          aria-label="Rejeitar sugestão"
          className="h-8 w-8 shrink-0 p-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
