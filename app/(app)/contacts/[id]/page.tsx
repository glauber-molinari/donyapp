import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { BoardType, JobType } from "@/types/database";
import { ContactDetailView } from "./contact-detail-view";

type JobRowForView = {
  id: string;
  name: string;
  type: JobType;
  board_type: BoardType;
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

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("name")
    .eq("id", params.id)
    .maybeSingle();

  return { title: contact?.name ?? "Contato" };
}

export default async function ContactDetailPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (contactErr) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ds-danger" role="alert">
          Não foi possível carregar este contato. Tente novamente.
        </p>
        <Link href="/contacts" className="text-sm font-medium text-ds-accent hover:brightness-90">
          Voltar aos contatos
        </Link>
      </div>
    );
  }

  if (!contact) {
    notFound();
  }

  const [{ data: jobs, error: jobsErr }, { data: notes, error: notesErr }, { data: account }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(
          `
        id, name, type, job_kind, board_type, deadline, internal_deadline, job_date,
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
      supabase
        .from("accounts")
        .select("album_board_enabled")
        .eq("id", contact.account_id)
        .maybeSingle(),
    ]);

  if (jobsErr) {
    console.error("contact detail jobs:", jobsErr.message);
  }
  if (notesErr) {
    console.error("contact detail notes:", notesErr.message);
  }

  return (
    <ContactDetailView
      contact={contact}
      jobs={(jobs ?? []) as unknown as JobRowForView[]}
      notes={(notes ?? []) as unknown as NoteRowForView[]}
      albumBoardEnabled={Boolean(account?.album_board_enabled)}
    />
  );
}
