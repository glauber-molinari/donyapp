import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type DashboardMetrics = {
  activeJobs: number;
  overdue: number;
  dueSoon: number;
  deliveredThisMonth: number;
  toEditThisMonth: number;
};

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Métricas do PASSO 10 (PRODUCT.md). Escopo da conta via RLS (sem filtrar account_id no client).
 */
export async function fetchDashboardMetrics(
  supabase: SupabaseClient<Database>
): Promise<DashboardMetrics> {
  const today = new Date();
  const todayYmd = localYmd(today);
  const plus3Ymd = localYmd(addDays(today, 3));

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthStartYmd = localYmd(monthStart);
  const monthEndYmd = localYmd(monthEnd);

  const { data: stages } = await supabase.from("kanban_stages").select("id, is_final");

  const nonFinalIds = (stages ?? []).filter((s) => !s.is_final).map((s) => s.id);
  const finalIds = (stages ?? []).filter((s) => s.is_final).map((s) => s.id);

  const empty: DashboardMetrics = {
    activeJobs: 0,
    overdue: 0,
    dueSoon: 0,
    deliveredThisMonth: 0,
    toEditThisMonth: 0,
  };

  if (nonFinalIds.length === 0 && finalIds.length === 0) {
    return empty;
  }

  const base = () =>
    supabase.from("jobs").select("*", { count: "exact", head: true }).neq("job_kind", "video_edit");

  let activeJobs = 0;
  let overdue = 0;
  let dueSoon = 0;
  let toEditThisMonth = 0;

  if (nonFinalIds.length > 0) {
    const a = await base().in("stage_id", nonFinalIds);
    activeJobs = a.count ?? 0;

    const o = await base().in("stage_id", nonFinalIds).lt("deadline", todayYmd);
    overdue = o.count ?? 0;

    const ds = await base()
      .in("stage_id", nonFinalIds)
      .gte("deadline", todayYmd)
      .lte("deadline", plus3Ymd);
    dueSoon = ds.count ?? 0;

    const te = await base()
      .in("stage_id", nonFinalIds)
      .gte("deadline", monthStartYmd)
      .lte("deadline", monthEndYmd);
    toEditThisMonth = te.count ?? 0;
  }

  let deliveredThisMonth = 0;
  if (finalIds.length > 0) {
    const d = await base()
      .in("stage_id", finalIds)
      .gte("updated_at", monthStart.toISOString())
      .lte("updated_at", monthEnd.toISOString());
    deliveredThisMonth = d.count ?? 0;
  }

  return {
    activeJobs,
    overdue,
    dueSoon,
    deliveredThisMonth,
    toEditThisMonth,
  };
}
