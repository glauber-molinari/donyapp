import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NoteEditorClient, type ContactOption, type JobOption } from "../note-editor-client";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nova nota",
};

export default async function NewNotePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: contacts, error: contactsErr }, { data: jobs, error: jobsErr }] = await Promise.all([
    supabase.from("contacts").select("id, name, email").order("name", { ascending: true }),
    supabase.from("jobs").select("id, name, contact_id").order("created_at", { ascending: false }),
  ]);

  if (contactsErr || jobsErr) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Nova nota</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os dados. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <NoteEditorClient
      mode="create"
      contacts={(contacts ?? []) as ContactOption[]}
      jobs={(jobs ?? []) as JobOption[]}
    />
  );
}
