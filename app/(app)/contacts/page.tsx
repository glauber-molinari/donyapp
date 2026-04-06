import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ContactsView } from "./contacts-view";

export const metadata: Metadata = {
  title: "Contatos",
};

export default async function ContactsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Contatos</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os contatos. Tente novamente.
        </p>
      </div>
    );
  }

  return <ContactsView contacts={contacts ?? []} />;
}
