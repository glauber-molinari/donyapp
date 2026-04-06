import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { JobWithRelations } from "../dashboard/dashboard-view";
import { BoardView } from "./board-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edições",
};

export default async function BoardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Edições</h1>
        <p className="mt-2 text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const [jobsRes, stagesRes, contactsRes, workTypesRes, subRes, accountRes] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        `
        *,
        contacts ( id, name, email ),
        kanban_stages ( id, name, position, is_final ),
        job_work_types ( id, name )
      `
      )
      .order("stage_id", { ascending: true })
      .order("position", { ascending: true }),
    supabase.from("kanban_stages").select("*").order("position", { ascending: true }),
    supabase.from("contacts").select("id, name, email").order("name", { ascending: true }),
    supabase
      .from("job_work_types")
      .select("*")
      .eq("account_id", profile.account_id)
      .order("position", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("accounts").select("*").eq("id", profile.account_id).single(),
  ]);

  const fetchError =
    jobsRes.error ??
    stagesRes.error ??
    contactsRes.error ??
    workTypesRes.error ??
    subRes.error ??
    accountRes.error;

  if (fetchError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[board] Falha ao carregar dados:", fetchError);
    }
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Edições</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar o quadro. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <BoardView
      jobs={(jobsRes.data ?? []) as JobWithRelations[]}
      stages={stagesRes.data ?? []}
      contacts={contactsRes.data ?? []}
      workTypes={workTypesRes.data ?? []}
      plan={subRes.data?.plan ?? "free"}
      senderName={profile.name}
      replyToEmail={profile.email}
      accountSubjectTemplate={accountRes.data?.delivery_email_subject_template ?? null}
      accountBodyTemplate={accountRes.data?.delivery_email_body_template ?? null}
    />
  );
}
