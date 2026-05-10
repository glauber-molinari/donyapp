import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SecurityForm } from "./security-form";

export const metadata: Metadata = {
  title: "Segurança",
};

export default async function SecurityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const providers = user.identities?.map((i) => i.provider) ?? [];
  const hasEmailProvider = providers.includes("email");
  const currentEmail = user.email ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Segurança</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Gerencie o email e a senha da sua conta.
        </p>
      </div>
      <SecurityForm hasEmailProvider={hasEmailProvider} currentEmail={currentEmail} />
    </div>
  );
}
