import type { SupabaseClient } from "@supabase/supabase-js";
import { differenceInCalendarDays } from "date-fns";

import type { Database, SupportTicketCategory } from "@/types/database";

export type NotificationKind =
  | "job_delivery"
  | "job_internal"
  | "task_deadline"
  | "support_reply"
  | "form_new";

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  job_delivery: "Job · entrega",
  job_internal: "Job · prazo interno",
  task_deadline: "Tarefa",
  support_reply: "Suporte",
  form_new: "Formulário",
};

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  jobId?: string;
  taskId?: string;
  ticketId?: string;
  submissionId?: string;
}

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  contact?: { name: string } | null;
};

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const SUPPORT_CATEGORY_LABEL: Record<SupportTicketCategory, string> = {
  problema_tecnico: "Problema técnico",
  duvida: "Dúvida",
  cobranca: "Cobrança",
  sugestao: "Sugestão",
  outro: "Outro",
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

/** Ordem na lista: menor = mais urgente */
function sortPriority(n: Notification): number {
  if (n.id.includes("overdue")) return 0;
  if (n.kind === "support_reply" || n.kind === "form_new") return 1;
  return 2;
}

/**
 * Notificações do app: prazos de jobs (entrega e interno), prazos de tarefas,
 * respostas novas no suporte e formulários recebidos ainda não vistos.
 */
export async function fetchAppNotifications(
  supabase: SupabaseClient<Database>
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const today = new Date();
  const todayYmd = localYmd(today);
  const plus3Ymd = localYmd(addDays(today, 3));

  const { data: stages } = await supabase.from("kanban_stages").select("id, is_final");
  const nonFinalIds = (stages ?? []).filter((s) => !s.is_final).map((s) => s.id);

  const [
    { data: overdueJobs },
    { data: dueSoonJobs },
    { data: overdueJobsInternal },
    { data: dueSoonJobsInternal },
    { data: overdueTasks },
    { data: dueSoonTasks },
    { data: supportTickets },
    { data: formRows },
  ] = await Promise.all([
    nonFinalIds.length
      ? supabase
          .from("jobs")
          .select("*, contact:contacts(name)")
          .in("stage_id", nonFinalIds)
          .lt("deadline", todayYmd)
          .order("deadline", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as Job[] }),
    nonFinalIds.length
      ? supabase
          .from("jobs")
          .select("*, contact:contacts(name)")
          .in("stage_id", nonFinalIds)
          .gte("deadline", todayYmd)
          .lte("deadline", plus3Ymd)
          .order("deadline", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as Job[] }),
    nonFinalIds.length
      ? supabase
          .from("jobs")
          .select("*, contact:contacts(name)")
          .in("stage_id", nonFinalIds)
          .lt("internal_deadline", todayYmd)
          .order("internal_deadline", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as Job[] }),
    nonFinalIds.length
      ? supabase
          .from("jobs")
          .select("*, contact:contacts(name)")
          .in("stage_id", nonFinalIds)
          .gte("internal_deadline", todayYmd)
          .lte("internal_deadline", plus3Ymd)
          .order("internal_deadline", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] as Job[] }),
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "feito")
      .lt("deadline", todayYmd)
      .order("deadline", { ascending: true })
      .limit(20),
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "feito")
      .gte("deadline", todayYmd)
      .lte("deadline", plus3Ymd)
      .order("deadline", { ascending: true })
      .limit(20),
    supabase
      .from("support_tickets")
      .select("id, category, description, updated_at")
      .eq("has_unread_reply", true)
      .order("updated_at", { ascending: false })
      .limit(15),
    supabase
      .from("form_submissions")
      .select("id, submitted_at, form_templates(title)")
      .eq("viewed", false)
      .order("submitted_at", { ascending: false })
      .limit(15),
  ]);

  (overdueJobs ?? []).forEach((job: Job) => {
    const daysLate = Math.abs(differenceInCalendarDays(new Date(job.deadline), today));
    const contactName = job.contact?.name;
    notifications.push({
      id: `job-overdue-${job.id}`,
      kind: "job_delivery",
      title: `Prazo de entrega vencido: ${job.name}`,
      description: `${daysLate} dia(s) atrasado${contactName ? ` · ${contactName}` : ""}`,
      timestamp: new Date(job.deadline),
      read: false,
      jobId: job.id,
    });
  });

  (dueSoonJobs ?? []).forEach((job: Job) => {
    const daysLeft = differenceInCalendarDays(new Date(job.deadline), today);
    const contactName = job.contact?.name;
    const dayText = daysLeft === 0 ? "hoje" : daysLeft === 1 ? "amanhã" : `em ${daysLeft} dias`;
    notifications.push({
      id: `job-due-soon-${job.id}`,
      kind: "job_delivery",
      title: `Entrega próxima: ${job.name}`,
      description: `Prazo ${dayText}${contactName ? ` · ${contactName}` : ""}`,
      timestamp: new Date(job.deadline),
      read: false,
      jobId: job.id,
    });
  });

  (overdueJobsInternal ?? []).forEach((job: Job) => {
    const daysLate = Math.abs(differenceInCalendarDays(new Date(job.internal_deadline), today));
    const contactName = job.contact?.name;
    notifications.push({
      id: `job-internal-overdue-${job.id}`,
      kind: "job_internal",
      title: `Prazo interno vencido: ${job.name}`,
      description: `${daysLate} dia(s) atrasado${contactName ? ` · ${contactName}` : ""}`,
      timestamp: new Date(job.internal_deadline),
      read: false,
      jobId: job.id,
    });
  });

  (dueSoonJobsInternal ?? []).forEach((job: Job) => {
    const daysLeft = differenceInCalendarDays(new Date(job.internal_deadline), today);
    const contactName = job.contact?.name;
    const dayText = daysLeft === 0 ? "hoje" : daysLeft === 1 ? "amanhã" : `em ${daysLeft} dias`;
    notifications.push({
      id: `job-internal-due-soon-${job.id}`,
      kind: "job_internal",
      title: `Prazo interno próximo: ${job.name}`,
      description: `Meta ${dayText}${contactName ? ` · ${contactName}` : ""}`,
      timestamp: new Date(job.internal_deadline),
      read: false,
      jobId: job.id,
    });
  });

  (overdueTasks ?? []).forEach((task: Task) => {
    const daysLate = Math.abs(differenceInCalendarDays(new Date(task.deadline), today));
    notifications.push({
      id: `task-overdue-${task.id}`,
      kind: "task_deadline",
      title: `Tarefa atrasada: ${task.name}`,
      description: `${daysLate} dia(s) atrasado`,
      timestamp: new Date(task.deadline),
      read: false,
      taskId: task.id,
    });
  });

  (dueSoonTasks ?? []).forEach((task: Task) => {
    const daysLeft = differenceInCalendarDays(new Date(task.deadline), today);
    const dayText = daysLeft === 0 ? "hoje" : daysLeft === 1 ? "amanhã" : `em ${daysLeft} dias`;
    notifications.push({
      id: `task-due-soon-${task.id}`,
      kind: "task_deadline",
      title: `Tarefa próxima: ${task.name}`,
      description: `Prazo ${dayText}`,
      timestamp: new Date(task.deadline),
      read: false,
      taskId: task.id,
    });
  });

  (supportTickets ?? []).forEach((t) => {
    const cat = SUPPORT_CATEGORY_LABEL[t.category as SupportTicketCategory] ?? t.category;
    const preview =
      t.description.length > 80 ? `${t.description.slice(0, 80)}…` : t.description;
    notifications.push({
      id: `support-unread-${t.id}`,
      kind: "support_reply",
      title: "Nova resposta no suporte",
      description: `${cat} — ${preview}`,
      timestamp: new Date(t.updated_at),
      read: false,
      ticketId: t.id,
    });
  });

  type FormRow = {
    id: string;
    submitted_at: string;
    form_templates: { title: string } | { title: string }[] | null;
  };

  (formRows as FormRow[] | null | undefined)?.forEach((row) => {
    const tpl = row.form_templates;
    const title =
      Array.isArray(tpl) ? tpl[0]?.title : tpl && typeof tpl === "object" ? tpl.title : null;
    notifications.push({
      id: `form-unviewed-${row.id}`,
      kind: "form_new",
      title: title ? `Formulário recebido: ${title}` : "Novo envio de formulário",
      description: "Ainda não visualizado em Recebidos",
      timestamp: new Date(row.submitted_at),
      read: false,
      submissionId: row.id,
    });
  });

  notifications.sort((a, b) => {
    const pa = sortPriority(a);
    const pb = sortPriority(b);
    if (pa !== pb) return pa - pb;
    const aOver = a.id.includes("overdue");
    const bOver = b.id.includes("overdue");
    if (aOver && bOver) return a.timestamp.getTime() - b.timestamp.getTime();
    if (a.kind === "support_reply" || a.kind === "form_new") {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  return notifications.slice(0, 50);
}

/** @deprecated Use `fetchAppNotifications` */
export async function fetchDeadlineNotifications(
  supabase: SupabaseClient<Database>
): Promise<Notification[]> {
  return fetchAppNotifications(supabase);
}
