import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Atualiza assinatura para Pro (webhooks de pagamento; client com service role).
 */
export async function setSubscriptionPro(
  db: SupabaseClient<Database>,
  accountId: string,
  opts?: {
    asaasSubscriptionId?: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const row: Database["public"]["Tables"]["subscriptions"]["Update"] = {
    plan: "pro",
    status: "active",
    current_period_ends_at: periodEnd.toISOString(),
  };

  if (opts?.asaasSubscriptionId) {
    row.asaas_subscription_id = opts.asaasSubscriptionId;
  }

  const { error } = await db.from("subscriptions").update(row).eq("account_id", accountId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function setSubscriptionPastDueOrCanceled(
  db: SupabaseClient<Database>,
  accountId: string,
  status: "past_due" | "canceled"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await db.from("subscriptions").update({ status }).eq("account_id", accountId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
