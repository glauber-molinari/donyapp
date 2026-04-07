"use server";

import { revalidatePath } from "next/cache";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { setSubscriptionFreePlan, setSubscriptionProCourtesy } from "@/lib/subscriptions/upgrade-account";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function assertPlatformAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isPlatformAdminEmail(user.email)) {
    return { ok: false as const, error: "Não autorizado." };
  }
  return { ok: true as const, user };
}

function periodEndFromDateInput(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T23:59:59.999Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function adminGrantProCourtesyAction(formData: FormData): Promise<AdminActionResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const accountId = formData.get("accountId")?.toString().trim() ?? "";
  if (!UUID_RE.test(accountId)) {
    return { ok: false, error: "Conta inválida." };
  }

  const mode = formData.get("mode")?.toString() ?? "1";
  const months = Number(mode);
  const customDate = formData.get("periodEnd")?.toString() ?? "";

  let endsAt: string | null = null;
  if (mode === "custom") {
    endsAt = periodEndFromDateInput(customDate);
    if (!endsAt) {
      return { ok: false, error: "Data de término inválida (use AAAA-MM-DD)." };
    }
  } else if (Number.isFinite(months) && months >= 1 && months <= 60) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    endsAt = d.toISOString();
  } else {
    return { ok: false, error: "Período inválido." };
  }

  const clearAsaas = formData.get("clearAsaas") === "on" || formData.get("clearAsaas") === "true";

  const svc = createServiceRoleClient();
  if (!svc) {
    return { ok: false, error: "Service role do Supabase não configurada." };
  }

  const r = await setSubscriptionProCourtesy(svc, accountId, endsAt, clearAsaas);
  if (!r.ok) {
    return { ok: false, error: r.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/planos");
  return { ok: true };
}

export async function adminRevokeProAction(formData: FormData): Promise<AdminActionResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const accountId = formData.get("accountId")?.toString().trim() ?? "";
  if (!UUID_RE.test(accountId)) {
    return { ok: false, error: "Conta inválida." };
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return { ok: false, error: "Service role do Supabase não configurada." };
  }

  const r = await setSubscriptionFreePlan(svc, accountId);
  if (!r.ok) {
    return { ok: false, error: r.error };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/planos");
  return { ok: true };
}
