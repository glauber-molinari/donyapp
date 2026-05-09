import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { FormField } from "@/lib/formularios/types";
import { EditorView } from "./editor-view";

export const metadata: Metadata = { title: "Editor de Formulário" };

interface Props {
  params: { id: string };
}

export default async function EditorPage({ params }: Props) {
  if (params.id === "novo") {
    return <EditorView template={null} />;
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  const fields = Array.isArray(data.fields)
    ? (data.fields as unknown as FormField[])
    : [];

  const template = {
    ...data,
    fields,
  };

  return <EditorView template={template} />;
}
