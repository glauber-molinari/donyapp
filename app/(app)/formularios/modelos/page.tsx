import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { FormTemplate } from "@/lib/formularios/types";
import type { FormField } from "@/lib/formularios/types";
import { ModelosView } from "./modelos-view";

export const metadata: Metadata = { title: "Modelos de Formulário" };

export default async function ModelosPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("form_templates")
    .select("*")
    .order("created_at", { ascending: false });

  const templates: FormTemplate[] = (data ?? []).map((t) => ({
    ...t,
    fields: Array.isArray(t.fields) ? (t.fields as unknown as FormField[]) : [],
  }));

  return <ModelosView templates={templates} />;
}
