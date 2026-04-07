import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { finalizeExpiredSubscriptionCancellations } from "@/lib/subscriptions/upgrade-account";

import { SettingsPlanSection } from "../settings-plan-section";

export const metadata: Metadata = {
  title: "Plano",
};

export default async function SettingsPlanPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
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

  const svc = createServiceRoleClient();
  if (svc) {
    await finalizeExpiredSubscriptionCancellations(svc);
  }

  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_ends_at, extra_users, cancel_at_period_end, asaas_subscription_id")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  if (subErr) {
    return (
      <div>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar a assinatura.
        </p>
      </div>
    );
  }

  const paymentSuccess = searchParams.status === "success";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SettingsPlanSection
        plan={sub?.plan ?? "free"}
        status={sub?.status ?? "active"}
        currentPeriodEndsAt={sub?.current_period_ends_at ?? null}
        extraUsers={sub?.extra_users ?? 0}
        cancelAtPeriodEnd={sub?.cancel_at_period_end ?? false}
        canCancelSubscription={
          profile.role === "admin" &&
          sub?.plan === "pro" &&
          !sub?.cancel_at_period_end &&
          Boolean(sub?.asaas_subscription_id?.trim())
        }
        isAdmin={profile.role === "admin"}
        paymentSuccess={paymentSuccess}
      />
    </div>
  );
}
