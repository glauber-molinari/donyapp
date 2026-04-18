import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SettingsImportSection } from "../settings-import-section";

export const metadata: Metadata = {
  title: "Importar contatos",
};

export default async function ImportSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <SettingsImportSection />;
}
