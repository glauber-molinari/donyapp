import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NoteEditorClient, type ContactOption, type JobOption, type NoteEditorInitial } from "../note-editor-client";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: note } = await supabase
    .from("contact_notes")
    .select("title")
    .eq("id", params.id)
    .maybeSingle();

  const title = note?.title?.trim() || "Nota";
  return { title };
}

export default async function EditNotePage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: note, error: noteErr }, { data: contacts, error: contactsErr }, { data: jobs, error: jobsErr }] =
    await Promise.all([
      supabase
        .from("contact_notes")
        .select(
          `
          id,
          contact_id,
          job_id,
          title,
          content,
          categories,
          priority,
          created_at
        `
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase.from("contacts").select("id, name, email").order("name", { ascending: true }),
      supabase.from("jobs").select("id, name, contact_id").order("created_at", { ascending: false }),
    ]);

  if (contactsErr || jobsErr) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Nota</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os dados. Tente novamente.
        </p>
      </div>
    );
  }

  if (noteErr || !note) {
    notFound();
  }

  const initial: NoteEditorInitial = {
    contact_id: note.contact_id,
    job_id: note.job_id,
    title: note.title,
    content: note.content,
    categories: note.categories,
    priority: note.priority,
  };

  return (
    <NoteEditorClient
      mode="edit"
      noteId={note.id}
      initial={initial}
      contacts={(contacts ?? []) as ContactOption[]}
      jobs={(jobs ?? []) as JobOption[]}
    />
  );
}
