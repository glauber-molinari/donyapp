import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { FormField } from "@/lib/formularios/types";
import type { SubmissionWithTemplate } from "@/lib/formularios/types";
import { RecebidosView } from "./recebidos-view";

export const metadata: Metadata = { title: "Formulários Recebidos" };

export default async function RecebidosPage() {
  const supabase = createClient();

  const [{ data: submissions }, { data: templates }] = await Promise.all([
    supabase
      .from("form_submissions")
      .select("*, form_templates(title)")
      .order("submitted_at", { ascending: false })
      .limit(200),
    supabase
      .from("form_templates")
      .select("id, title, fields")
      .order("title"),
  ]);

  const templateMap = new Map(
    (templates ?? []).map((t) => [
      t.id,
      Array.isArray(t.fields) ? (t.fields as unknown as FormField[]) : [],
    ])
  );

  return (
    <RecebidosView
      submissions={(submissions as SubmissionWithTemplate[]) ?? []}
      templateMap={Object.fromEntries(templateMap)}
    />
  );
}
