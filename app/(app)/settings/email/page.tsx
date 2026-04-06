import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsEmailSection } from "../settings-email-section";

export const metadata: Metadata = {
  title: "E-mail",
};

export default async function SettingsEmailPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <p className="text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const [accountRes, subRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("id", profile.account_id).single(),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (accountRes.error) {
    return (
      <div>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os modelos de e-mail.
        </p>
      </div>
    );
  }

  const plan = subRes.data?.plan ?? "free";
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">E-mail ao cliente</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Modelo padrão ao enviar o link do material pelo quadro (plano Pro). O e-mail de resposta
          continua sendo o do seu perfil.
        </p>
      </div>
      <SettingsEmailSection
        plan={plan}
        isAdmin={isAdmin}
        initialSubject={accountRes.data?.delivery_email_subject_template ?? null}
        initialBody={accountRes.data?.delivery_email_body_template ?? null}
      />
    </div>
  );
}
