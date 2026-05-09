import { notFound } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { FormField } from "@/lib/formularios/types";
import { FormPublicoClient } from "./form-publico-client";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServiceRoleClient();
  if (!supabase) return { title: "Formulário" };

  const { data } = await supabase
    .from("form_templates")
    .select("title, description")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (!data) return { title: "Formulário" };

  return {
    title: data.title,
    description: data.description ?? undefined,
  };
}

export default async function FormularioPage({ params }: Props) {
  const supabase = createServiceRoleClient();
  if (!supabase) notFound();

  const { data: template } = await supabase
    .from("form_templates")
    .select("id, title, description, slug, fields")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (!template) notFound();

  return (
    <FormPublicoClient
      slug={template.slug}
      title={template.title}
      description={template.description}
      fields={Array.isArray(template.fields) ? (template.fields as unknown as FormField[]) : []}
    />
  );
}
