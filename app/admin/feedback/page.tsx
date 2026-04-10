import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

import {
  FeedbackAdminView,
  type AdminSuggestion,
  type SuggestionStage,
  type SuggestionStatus,
} from "./feedback-admin-view";

export const metadata: Metadata = {
  title: "Feedback — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage() {
  const svc = createServiceRoleClient();

  if (!svc) {
    return (
      <div className="rounded-ds-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Configure <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> para
        acessar as sugestões.
      </div>
    );
  }

  // Busca todas as sugestões com contagem de votos e e-mail do autor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw, error } = await (svc as any)
    .from("feedback_suggestions")
    .select(
      "id, title, description, status, stage, created_at, user_id, feedback_votes(id), users(email)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Feedback</h2>
        <p className="mt-2 text-sm text-red-600">
          Erro ao carregar sugestões: {(error as { message: string }).message}
        </p>
      </div>
    );
  }

  const suggestions: AdminSuggestion[] = (raw ?? []).map(
    (row: {
      id: string;
      title: string;
      description: string | null;
      status: SuggestionStatus;
      stage: SuggestionStage | null;
      created_at: string;
      feedback_votes: unknown[];
      users: { email: string } | null;
    }) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      stage: row.stage,
      vote_count: Array.isArray(row.feedback_votes) ? row.feedback_votes.length : 0,
      created_at: row.created_at,
      user_email: row.users?.email ?? null,
    })
  );

  const pending = suggestions.filter((s) => s.status === "pending");
  const approved = suggestions.filter((s) => s.status === "approved");
  const rejected = suggestions.filter((s) => s.status === "rejected");

  return <FeedbackAdminView pending={pending} approved={approved} rejected={rejected} />;
}
