"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function getAdminPro() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.account_id || profile.role !== "admin") {
    return { error: "Apenas administradores podem alterar as notificações." };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();
  if ((sub?.plan ?? "free") !== "pro") {
    return { error: "Notificações via WhatsApp estão disponíveis no plano Pro." };
  }

  return { supabase, accountId: profile.account_id as string };
}

export async function saveWhatsappSettings(formData: {
  whatsapp_number: string;
  whatsapp_notifications_enabled: boolean;
  whatsapp_notify_days_before: number[];
  whatsapp_notify_jobs: boolean;
  whatsapp_notify_internal_deadline: boolean;
  whatsapp_notify_tasks: boolean;
  whatsapp_weekly_summary: boolean;
  whatsapp_overdue_alerts: boolean;
  whatsapp_client_delivery_enabled: boolean;
}): Promise<Result> {
  const ctx = await getAdminPro();
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const phone = formData.whatsapp_number.trim().replace(/\D/g, "");

  if (formData.whatsapp_notifications_enabled && !phone) {
    return { ok: false, error: "Informe o número de WhatsApp para ativar as notificações." };
  }

  const { error } = await ctx.supabase
    .from("accounts")
    .update({
      whatsapp_number: phone || null,
      whatsapp_notifications_enabled: formData.whatsapp_notifications_enabled,
      whatsapp_notify_days_before: formData.whatsapp_notify_days_before,
      whatsapp_notify_jobs: formData.whatsapp_notify_jobs,
      whatsapp_notify_internal_deadline: formData.whatsapp_notify_internal_deadline,
      whatsapp_notify_tasks: formData.whatsapp_notify_tasks,
      whatsapp_weekly_summary: formData.whatsapp_weekly_summary,
      whatsapp_overdue_alerts: formData.whatsapp_overdue_alerts,
      whatsapp_client_delivery_enabled: formData.whatsapp_client_delivery_enabled,
    })
    .eq("id", ctx.accountId);

  if (error) return { ok: false, error: "Não foi possível salvar as configurações." };

  revalidatePath("/settings/notifications");
  return { ok: true };
}

export async function saveSenderInstance(formData: {
  zapi_sender_instance_id: string;
  zapi_sender_token: string;
}): Promise<Result> {
  const ctx = await getAdminPro();
  if ("error" in ctx) return { ok: false, error: ctx.error as string };

  const instanceId = formData.zapi_sender_instance_id.trim();
  const token = formData.zapi_sender_token.trim();

  const { error } = await ctx.supabase
    .from("accounts")
    .update({
      zapi_sender_instance_id: instanceId || null,
      zapi_sender_token: token || null,
      zapi_sender_connected: false,
    })
    .eq("id", ctx.accountId);

  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/settings/notifications");
  return { ok: true };
}
