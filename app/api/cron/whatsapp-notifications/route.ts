import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendWhatsAppText, isPlatformConfigured } from "@/lib/whatsapp/client";
import {
  jobDeadlineMessage,
  internalDeadlineMessage,
  taskDeadlineMessage,
  overdueJobMessage,
  overdueTaskMessage,
} from "@/lib/whatsapp/templates";

function authGuard(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (secret) return auth === `Bearer ${secret}`;
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") return false;
  return true;
}

function getTodayBRT(): string {
  const now = new Date();
  // UTC-3
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

type NotificationType = "deadline" | "internal_deadline" | "overdue" | "weekly_summary";

async function wasAlreadySent(
  svc: ReturnType<typeof createServiceRoleClient>,
  accountId: string,
  entityId: string,
  entityType: "job" | "task",
  notifType: NotificationType,
  daysBefore: number | null,
  todayStr: string
) {
  const { data } = await svc!
    .from("whatsapp_notification_logs")
    .select("id")
    .eq("account_id", accountId)
    .eq("entity_id", entityId)
    .eq("entity_type", entityType)
    .eq("notification_type", notifType)
    .eq("sent_date", todayStr)
    .maybeSingle();

  if (daysBefore !== null) {
    const { data: d2 } = await svc!
      .from("whatsapp_notification_logs")
      .select("id")
      .eq("account_id", accountId)
      .eq("entity_id", entityId)
      .eq("entity_type", entityType)
      .eq("notification_type", notifType)
      .eq("days_before", daysBefore)
      .eq("sent_date", todayStr)
      .maybeSingle();
    return Boolean(d2);
  }

  return Boolean(data);
}

async function logSent(
  svc: ReturnType<typeof createServiceRoleClient>,
  accountId: string,
  entityId: string,
  entityType: "job" | "task",
  notifType: NotificationType,
  daysBefore: number | null,
  phone: string,
  todayStr: string
) {
  await svc!.from("whatsapp_notification_logs").insert({
    account_id: accountId,
    entity_id: entityId,
    entity_type: entityType,
    notification_type: notifType,
    days_before: daysBefore,
    phone,
    sent_date: todayStr,
  });
}

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

  const today = getTodayBRT();
  let sent = 0;
  let errors = 0;

  // Load active Pro accounts with WhatsApp enabled
  const { data: accounts } = await svc
    .from("accounts")
    .select(
      "id, name, whatsapp_number, whatsapp_notify_days_before, whatsapp_notify_jobs, whatsapp_notify_internal_deadline, whatsapp_notify_tasks, whatsapp_overdue_alerts"
    )
    .eq("whatsapp_notifications_enabled", true)
    .not("whatsapp_number", "is", null);

  if (!accounts?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "Nenhuma conta com WhatsApp ativo." });
  }

  // Filter to Pro accounts only
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
    const daysBefore: number[] = account.whatsapp_notify_days_before ?? [1, 3];
    const maxDays = Math.max(...daysBefore);

    // --- Job deadlines ---
    if (account.whatsapp_notify_jobs || account.whatsapp_notify_internal_deadline || account.whatsapp_overdue_alerts) {
      const deadlineEnd = addDays(today, maxDays);

      const { data: jobs } = await svc
        .from("jobs")
        .select(
          "id, name, deadline, internal_deadline, contact_id, contacts(name), kanban_stages(is_final)"
        )
        .eq("account_id", account.id)
        .lte("deadline", deadlineEnd);

      type JobRow = typeof jobs extends (infer T)[] | null ? T : never;
      for (const job of jobs ?? []) {
        const row = job as JobRow & { kanban_stages: { is_final: boolean } | null; contacts: { name: string } | null };
        if (row.kanban_stages?.is_final) continue;
        const clientName: string | null = row.contacts?.name ?? null;

        // Overdue alerts
        if (account.whatsapp_overdue_alerts) {
          const daysOver = daysBetween(job.deadline, today);
          if (daysOver > 0) {
            const alreadySent = await wasAlreadySent(svc, account.id, job.id, "job", "overdue", null, today);
            if (!alreadySent) {
              const msg = overdueJobMessage(job.name, clientName, daysOver, job.deadline);
              const r = await sendWhatsAppText(phone, msg);
              if (r.ok) {
                await logSent(svc, account.id, job.id, "job", "overdue", null, phone, today);
                sent++;
              } else {
                errors++;
              }
            }
            continue; // don't send "upcoming" if already overdue
          }
        }

        // Upcoming deadline alerts
        if (account.whatsapp_notify_jobs) {
          const daysLeft = daysBetween(today, job.deadline);
          for (const d of daysBefore) {
            if (daysLeft === d) {
              const alreadySent = await wasAlreadySent(svc, account.id, job.id, "job", "deadline", d, today);
              if (!alreadySent) {
                const msg = jobDeadlineMessage(job.name, clientName, daysLeft, job.deadline);
                const r = await sendWhatsAppText(phone, msg);
                if (r.ok) {
                  await logSent(svc, account.id, job.id, "job", "deadline", d, phone, today);
                  sent++;
                } else {
                  errors++;
                }
              }
            }
          }
        }

        // Internal deadline alerts
        if (account.whatsapp_notify_internal_deadline && job.internal_deadline) {
          const daysLeftInternal = daysBetween(today, job.internal_deadline);

          // Overdue internal
          if (daysLeftInternal < 0 && account.whatsapp_overdue_alerts) {
            const alreadySent = await wasAlreadySent(svc, account.id, job.id, "job", "internal_deadline", null, today);
            if (!alreadySent) {
              const msg = internalDeadlineMessage(job.name, 0, job.internal_deadline);
              const r = await sendWhatsAppText(phone, msg);
              if (r.ok) {
                await logSent(svc, account.id, job.id, "job", "internal_deadline", null, phone, today);
                sent++;
              } else {
                errors++;
              }
            }
          } else {
            for (const d of daysBefore) {
              if (daysLeftInternal === d) {
                const alreadySent = await wasAlreadySent(svc, account.id, job.id, "job", "internal_deadline", d, today);
                if (!alreadySent) {
                  const msg = internalDeadlineMessage(job.name, daysLeftInternal, job.internal_deadline);
                  const r = await sendWhatsAppText(phone, msg);
                  if (r.ok) {
                    await logSent(svc, account.id, job.id, "job", "internal_deadline", d, phone, today);
                    sent++;
                  } else {
                    errors++;
                  }
                }
              }
            }
          }
        }
      }
    }

    // --- Task deadlines ---
    if (account.whatsapp_notify_tasks) {
      const taskDeadlineEnd = addDays(today, maxDays);

      const { data: tasks } = await svc
        .from("tasks")
        .select("id, name, deadline, status")
        .eq("account_id", account.id)
        .neq("status", "feito")
        .lte("deadline", taskDeadlineEnd);

      for (const task of tasks ?? []) {
        const daysLeft = daysBetween(today, task.deadline);

        if (daysLeft < 0 && account.whatsapp_overdue_alerts) {
          const alreadySent = await wasAlreadySent(svc, account.id, task.id, "task", "overdue", null, today);
          if (!alreadySent) {
            const msg = overdueTaskMessage(task.name, Math.abs(daysLeft), task.deadline);
            const r = await sendWhatsAppText(phone, msg);
            if (r.ok) {
              await logSent(svc, account.id, task.id, "task", "overdue", null, phone, today);
              sent++;
            } else {
              errors++;
            }
          }
          continue;
        }

        for (const d of daysBefore) {
          if (daysLeft === d) {
            const alreadySent = await wasAlreadySent(svc, account.id, task.id, "task", "deadline", d, today);
            if (!alreadySent) {
              const msg = taskDeadlineMessage(task.name, daysLeft, task.deadline);
              const r = await sendWhatsAppText(phone, msg);
              if (r.ok) {
                await logSent(svc, account.id, task.id, "task", "deadline", d, phone, today);
                sent++;
              } else {
                errors++;
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors, date: today });
}
