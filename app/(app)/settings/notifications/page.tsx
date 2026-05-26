import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsWhatsappSection } from "./settings-whatsapp-section";

export const metadata: Metadata = {
  title: "Notificações",
};

export default async function SettingsNotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <p className="text-sm text-ds-muted" role="alert">
        Conta não encontrada para este usuário.
      </p>
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
      <p className="mt-2 text-sm text-red-600" role="alert">
        Não foi possível carregar as configurações de notificações.
      </p>
    );
  }

  const plan = subRes.data?.plan ?? "free";
  const isAdmin = profile.role === "admin";
  const account = accountRes.data;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Notificações via WhatsApp</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Alertas de prazo, resumo semanal e envio de entrega ao cliente pelo WhatsApp.
        </p>
      </div>
      <SettingsWhatsappSection
        plan={plan}
        isAdmin={isAdmin}
        account={{
          whatsapp_number: account.whatsapp_number ?? null,
          whatsapp_notifications_enabled: account.whatsapp_notifications_enabled ?? false,
          whatsapp_notify_days_before: account.whatsapp_notify_days_before ?? [1, 3],
          whatsapp_notify_jobs: account.whatsapp_notify_jobs ?? true,
          whatsapp_notify_internal_deadline: account.whatsapp_notify_internal_deadline ?? true,
          whatsapp_notify_tasks: account.whatsapp_notify_tasks ?? true,
          whatsapp_weekly_summary: account.whatsapp_weekly_summary ?? false,
          whatsapp_overdue_alerts: account.whatsapp_overdue_alerts ?? true,
          whatsapp_client_delivery_enabled: account.whatsapp_client_delivery_enabled ?? false,
          zapi_sender_instance_id: account.zapi_sender_instance_id ?? null,
          zapi_sender_token: account.zapi_sender_token ?? null,
          zapi_sender_connected: account.zapi_sender_connected ?? false,
        }}
      />
    </div>
  );
}
