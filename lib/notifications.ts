import type { SupabaseClient } from "@supabase/supabase-js";
import { differenceInCalendarDays } from "date-fns";

import type { Database } from "@/types/database";

export type NotificationType = "deadline" | "update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  jobId?: string;
  taskId?: string;
}

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  contact?: { name: string } | null;
};

type Task = Database["public"]["Tables"]["tasks"]["Row"];

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

export async function fetchDeadlineNotifications(
  supabase: SupabaseClient<Database>
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const today = new Date();
  const todayYmd = localYmd(today);
  const plus3Ymd = localYmd(addDays(today, 3));

  const { data: stages } = await supabase.from("kanban_stages").select("id, is_final");
  const nonFinalIds = (stages ?? []).filter((s) => !s.is_final).map((s) => s.id);

  if (nonFinalIds.length === 0) {
    return notifications;
  }

  const { data: overdueJobs } = await supabase
    .from("jobs")
    .select("*, contact:contacts(name)")
    .in("stage_id", nonFinalIds)
    .lt("deadline", todayYmd)
    .order("deadline", { ascending: true })
    .limit(20);

  const { data: dueSoonJobs } = await supabase
    .from("jobs")
    .select("*, contact:contacts(name)")
    .in("stage_id", nonFinalIds)
    .gte("deadline", todayYmd)
    .lte("deadline", plus3Ymd)
    .order("deadline", { ascending: true })
    .limit(20);

  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "feito")
    .lt("deadline", todayYmd)
    .order("deadline", { ascending: true })
    .limit(20);

  const { data: dueSoonTasks } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "feito")
    .gte("deadline", todayYmd)
    .lte("deadline", plus3Ymd)
    .order("deadline", { ascending: true })
    .limit(20);

  (overdueJobs ?? []).forEach((job: Job) => {
    const daysLate = Math.abs(differenceInCalendarDays(new Date(job.deadline), today));
    const contactName = job.contact?.name;
    notifications.push({
      id: `job-overdue-${job.id}`,
      type: "deadline",
      title: `Prazo vencido: ${job.name}`,
      description: `${daysLate} dia(s) atrasado${contactName ? ` · ${contactName}` : ''}`,
      timestamp: new Date(job.deadline),
      read: false,
      jobId: job.id,
    });
  });

  (dueSoonJobs ?? []).forEach((job: Job) => {
    const daysLeft = differenceInCalendarDays(new Date(job.deadline), today);
    const contactName = job.contact?.name;
    const dayText = daysLeft === 0 ? "Hoje" : daysLeft === 1 ? "Amanhã" : `${daysLeft} dias`;
    notifications.push({
      id: `job-due-soon-${job.id}`,
      type: "deadline",
      title: `Prazo próximo: ${job.name}`,
      description: `Entrega em ${dayText}${contactName ? ` · ${contactName}` : ''}`,
      timestamp: new Date(job.deadline),
      read: false,
      jobId: job.id,
    });
  });

  (overdueTasks ?? []).forEach((task: Task) => {
    const daysLate = Math.abs(differenceInCalendarDays(new Date(task.deadline), today));
    notifications.push({
      id: `task-overdue-${task.id}`,
      type: "deadline",
      title: `Tarefa atrasada: ${task.name}`,
      description: `${daysLate} dia(s) atrasado`,
      timestamp: new Date(task.deadline),
      read: false,
      taskId: task.id,
    });
  });

  (dueSoonTasks ?? []).forEach((task: Task) => {
    const daysLeft = differenceInCalendarDays(new Date(task.deadline), today);
    const dayText = daysLeft === 0 ? "Hoje" : daysLeft === 1 ? "Amanhã" : `${daysLeft} dias`;
    notifications.push({
      id: `task-due-soon-${task.id}`,
      type: "deadline",
      title: `Tarefa próxima: ${task.name}`,
      description: `Prazo em ${dayText}`,
      timestamp: new Date(task.deadline),
      read: false,
      taskId: task.id,
    });
  });

  notifications.sort((a, b) => {
    const aOverdue = a.id.includes("overdue");
    const bOverdue = b.id.includes("overdue");
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  return notifications;
}
