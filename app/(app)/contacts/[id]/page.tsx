import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { JobType } from "@/types/database";
import { ContactDetailView } from "./contact-detail-view";

type JobRowForView = {
  id: string;
  name: string;
  type: JobType;
  deadline: string;
  internal_deadline: string;
  job_date: string | null;
  delivery_link: string | null;
  created_at: string;
  updated_at: string;
  stage: { id: string; name: string; color: string; is_final: boolean } | null;
  work_type: { id: string; name: string } | null;
};

type NoteRowForView = {
  id: string;
  title: string | null;
  content: string;
  categories: string[];
  priority: string;
  created_at: string;
  job: { id: string; name: string } | null;
};

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();

  return { title: contact?.name ?? "Contato" };
}

export default async function ContactDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: contact, error: contactErr },
    { data: jobs, error: jobsErr },
    { data: notes, error: notesErr },
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("jobs")
      .select(
        `
        id, name, type, job_kind, deadline, internal_deadline, job_date,
        delivery_link, created_at, updated_at,
        stage:kanban_stages(id, name, color, is_final),
        work_type:job_work_types(id, name)
      `
      )
      .eq("contact_id", params.id)
      .eq("job_kind", "standard")
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_notes")
      .select(
        `
        id, title, content, categories, priority, created_at,
        job:jobs(id, name)
      `
      )
      .eq("contact_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (contactErr || jobsErr || notesErr) {
    return (
      <div>
        <p className="text-sm text-red-600" role="alert">
          Não foi possível carregar os dados. Tente novamente.
        </p>
      </div>
    );
  }

  if (!contact) {
    notFound();
  }

  return (
    <ContactDetailView
      contact={contact}
      jobs={(jobs ?? []) as unknown as JobRowForView[]}
      notes={(notes ?? []) as unknown as NoteRowForView[]}
    />
  );
}
