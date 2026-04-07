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
    cancel_at_period_end: false,
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

/**
 * Pro cortesia ou ajuste manual: define fim do período e remove vínculo Asaas quando solicitado.
 */
export async function setSubscriptionProCourtesy(
  db: SupabaseClient<Database>,
  accountId: string,
  currentPeriodEndsAtIso: string,
  clearAsaasSubscriptionId: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row: Database["public"]["Tables"]["subscriptions"]["Update"] = {
    plan: "pro",
    status: "active",
    current_period_ends_at: currentPeriodEndsAtIso,
    cancel_at_period_end: false,
  };
  if (clearAsaasSubscriptionId) {
    row.asaas_subscription_id = null;
  }

  const { data, error } = await db
    .from("subscriptions")
    .update(row)
    .eq("account_id", accountId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return { ok: false, error: "Nenhuma assinatura encontrada para esta conta." };
  }
  return { ok: true };
}

/** Volta ao plano Free ativo (como no provisionamento de nova conta). */
export async function setSubscriptionFreePlan(
  db: SupabaseClient<Database>,
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await db
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      current_period_ends_at: null,
      trial_ends_at: null,
      asaas_subscription_id: null,
      cancel_at_period_end: false,
    })
    .eq("account_id", accountId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    return { ok: false, error: "Nenhuma assinatura encontrada para esta conta." };
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

/** Contas Pro com cancelamento agendado cujo período pago já encerrou → Free. */
export async function finalizeExpiredSubscriptionCancellations(
  db: SupabaseClient<Database>
): Promise<{ ok: true; finalized: number } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { data: rows, error: selErr } = await db
    .from("subscriptions")
    .select("account_id")
    .eq("plan", "pro")
    .eq("cancel_at_period_end", true)
    .not("current_period_ends_at", "is", null)
    .lte("current_period_ends_at", now);

  if (selErr) {
    return { ok: false, error: selErr.message };
  }

  let finalized = 0;
  for (const row of rows ?? []) {
    const r = await setSubscriptionFreePlan(db, row.account_id);
    if (r.ok) {
      finalized += 1;
    }
  }
  return { ok: true, finalized };
}

/**
 * Marca cancelamento ao fim do período (não renova).
 * Webhook: use `strict: false` para ignorar se já não for Pro (idempotência).
 */
export async function setSubscriptionCancelAtPeriodEnd(
  db: SupabaseClient<Database>,
  accountId: string,
  opts?: { strict?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const strict = opts?.strict !== false;
  const { data, error } = await db
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      status: "active",
    })
    .eq("account_id", accountId)
    .eq("plan", "pro")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.length) {
    if (strict) {
      return { ok: false, error: "Assinatura Pro não encontrada." };
    }
    return { ok: true };
  }
  return { ok: true };
}
