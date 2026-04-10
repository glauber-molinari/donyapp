import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { NotesView, type NoteWithRelations } from "./notes-view";

export const metadata: Metadata = {
  title: "Anotações",
};

export default async function NotesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notes, error: notesErr } = await supabase
    .from("contact_notes")
    .select(
      `
          *,
          contacts ( id, name, email ),
          jobs ( id, name, contact_id )
        `
    )
    .order("created_at", { ascending: false });

  if (notesErr) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Anotações</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar as anotações. Tente novamente.
        </p>
      </div>
    );
  }

  return <NotesView notes={(notes ?? []) as NoteWithRelations[]} />;
}

