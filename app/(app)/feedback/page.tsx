import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { FeedbackView, type Suggestion } from "./feedback-view";

export const metadata: Metadata = {
  title: "Roadmap",
};

export default async function FeedbackPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Sugestões aprovadas com contagem de votos e se o usuário atual votou
  const { data: approvedRaw, error: approvedErr } = await supabase
    .from("feedback_suggestions")
    .select("id, title, description, stage, feedback_votes(user_id)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (approvedErr) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Roadmap</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar as sugestões. Tente novamente.
        </p>
      </div>
    );
  }

  const suggestions: Suggestion[] = (approvedRaw ?? []).map((row) => {
    const votes = Array.isArray(row.feedback_votes) ? row.feedback_votes : [];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      stage: (row.stage ?? "em_estudo") as Suggestion["stage"],
      vote_count: votes.length,
      user_voted: votes.some((v: { user_id: string }) => v.user_id === user.id),
    };
  });

  return <FeedbackView suggestions={suggestions} />;
}
