import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendWhatsAppText, isPlatformConfigured } from "@/lib/whatsapp/client";
import { weeklySummaryMessage } from "@/lib/whatsapp/templates";

function authGuard(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (secret) return auth === `Bearer ${secret}`;
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") return false;
  return true;
}

function getTodayBRT(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// Runs every Monday at 09:00 BRT (12:00 UTC)
export async function GET(req: Request) {
  if (!authGuard(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!isPlatformConfigured()) {
    return NextResponse.json({ ok: false, error: "Z-API não configurada." }, { status: 500 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ ok: false, error: "Service role não configurada." }, { status: 500 });
  }

  // Only run on Mondays
  const today = getTodayBRT();
  const dayOfWeek = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0=Sun, 1=Mon
  if (dayOfWeek !== 1) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Não é segunda-feira." });
  }

  const weekEnd = addDays(today, 7);
  let sent = 0;
  let errors = 0;

  const { data: accounts } = await svc
    .from("accounts")
    .select("id, name, whatsapp_number")
    .eq("whatsapp_notifications_enabled", true)
    .eq("whatsapp_weekly_summary", true)
    .not("whatsapp_number", "is", null);

  if (!accounts?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "Nenhuma conta com resumo semanal ativo." });
  }

  const accountIds = accounts.map((a) => a.id);
  const { data: proSubs } = await svc
    .from("subscriptions")
    .select("account_id")
    .in("account_id", accountIds)
    .eq("plan", "pro")
    .in("status", ["active", "trialing"]);

  const proAccountIds = new Set((proSubs ?? []).map((s) => s.account_id));

  for (const account of accounts) {
    if (!proAccountIds.has(account.id)) continue;

    const phone = account.whatsapp_number!;

    // Already sent today?
    const { data: existingLog } = await svc
      .from("whatsapp_notification_logs")
      .select("id")
      .eq("account_id", account.id)
      .eq("entity_type", "weekly")
      .eq("notification_type", "weekly_summary")
      .eq("sent_date", today)
      .maybeSingle();

    if (existingLog) continue;

    // Jobs this week (non-final stages)
    const { data: jobs } = await svc
      .from("jobs")
      .select("id, name, deadline, kanban_stages(is_final)")
      .eq("account_id", account.id)
      .gte("deadline", today)
      .lte("deadline", weekEnd);

    const weekJobs = (jobs ?? [])
      .filter((j) => !(j as unknown as { kanban_stages: { is_final: boolean } | null }).kanban_stages?.is_final)
      .map((j) => ({ name: j.name, deadline: j.deadline }));

    // Tasks this week
    const { data: tasks } = await svc
      .from("tasks")
      .select("id, name, deadline")
      .eq("account_id", account.id)
      .neq("status", "feito")
      .gte("deadline", today)
      .lte("deadline", weekEnd);

    const weekTasks = (tasks ?? []).map((t) => ({ name: t.name, deadline: t.deadline }));

    // Overdue jobs
    const { count: overdueJobCount } = await svc
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .lt("deadline", today);

    // Overdue tasks
    const { count: overdueTaskCount } = await svc
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .neq("status", "feito")
      .lt("deadline", today);

    const msg = weeklySummaryMessage(
      account.name,
      weekJobs,
      weekTasks,
      overdueJobCount ?? 0,
      overdueTaskCount ?? 0
    );

    const r = await sendWhatsAppText(phone, msg);
    if (r.ok) {
      await svc.from("whatsapp_notification_logs").insert({
        account_id: account.id,
        entity_id: "weekly",
        entity_type: "weekly",
        notification_type: "weekly_summary",
        days_before: null,
        phone,
        sent_date: today,
      });
      sent++;
    } else {
      errors++;
    }
  }

  return NextResponse.json({ ok: true, sent, errors, date: today });
}
