"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type JobWithStage = Job & {
  kanban_stages: { id: string; name: string; is_final: boolean } | null;
  job_work_types: { id: string; name: string } | null;
};

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAssignee = Database["public"]["Tables"]["task_assignees"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];
type ManualAssignee = Database["public"]["Tables"]["manual_job_assignees"]["Row"];

export type TopPerformer = {
  id: string;
  name: string;
  avatarUrl: string | null;
  averageDays: number;
  deliveries: number;
  tasksDone: number;
};

export interface DeliveryMetrics {
  averageDaysToDeliver: number;
  averageDaysByType: {
    foto: number;
    video: number;
    foto_video: number;
  };
  totalDelivered: number;
  deliveredOnTime: number;
  deliveredLate: number;
  percentOnTime: number;
  percentLate: number;
  tasksSummary: {
    total: number;
    done: number;
    open: number;
    doneOnTime: number;
    doneLate: number;
    percentDoneOnTime: number;
    averageDaysToComplete: number;
  };
  topPerformers: TopPerformer[];
  deliveriesByMonth: {
    month: string;
    total: number;
    onTime: number;
    late: number;
  }[];
  deliveriesByWorkType: {
    workTypeName: string;
    total: number;
    averageDays: number;
  }[];
  currentActiveJobs: number;
  averageRevisions: number;
}

export async function fetchDeliveryMetrics(): Promise<{ ok: boolean; data?: DeliveryMetrics; error?: string }> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Usuário não autenticado" };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return { ok: false, error: "Conta não encontrada" };
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .maybeSingle();

    if (subscription?.plan !== "pro") {
      return { ok: false, error: "Relatórios disponíveis apenas para o plano PRO" };
    }

    const { data: stages } = await supabase
      .from("kanban_stages")
      .select("id, name, is_final")
      .eq("account_id", profile.account_id);

    const finalStages = stages?.filter((s) => s.is_final).map((s) => s.id) ?? [];

    const [
      { data: allJobs },
      { data: allTasks },
      { data: users },
      { data: manualAssignees },
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          `
          *,
          kanban_stages (id, name, is_final),
          job_work_types (id, name)
        `
        )
        .eq("account_id", profile.account_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .eq("account_id", profile.account_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .eq("account_id", profile.account_id),
      supabase
        .from("manual_job_assignees")
        .select("id, name, email, photo_url")
        .eq("account_id", profile.account_id),
    ]);

    if (!allJobs || !allTasks) return { ok: false, error: "Erro ao carregar dados" };

    const jobs = allJobs as JobWithStage[];
    const tasks = allTasks as Task[];
    const accountUsers = (users ?? []) as Pick<User, "id" | "name" | "email" | "avatar_url">[];
    const manuals = (manualAssignees ?? []) as Pick<
      ManualAssignee,
      "id" | "name" | "email" | "photo_url"
    >[];

    const deliveredJobs = jobs.filter((j) => j.stage_id && finalStages.includes(j.stage_id));

    const totalDelivered = deliveredJobs.length;

    const jobsWithDays = deliveredJobs.map((job) => {
      const created = new Date(job.created_at);
      const deadline = new Date(job.deadline);
      
      let deliveredAt = new Date();
      if (job.stage_id) {
        const stageMovement = new Date(job.updated_at);
        if (stageMovement > created) {
          deliveredAt = stageMovement;
        }
      }

      const daysToDeliver = Math.ceil((deliveredAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      const isOnTime = deliveredAt <= deadline;

      return {
        ...job,
        daysToDeliver,
        isOnTime,
        deliveredAt,
      };
    });

    const totalDays = jobsWithDays.reduce((sum, j) => sum + j.daysToDeliver, 0);
    const averageDaysToDeliver = totalDelivered > 0 ? Math.round(totalDays / totalDelivered) : 0;

    const byType = jobsWithDays.reduce(
      (acc, job) => {
        if (!acc[job.type]) {
          acc[job.type] = { count: 0, totalDays: 0 };
        }
        acc[job.type].count++;
        acc[job.type].totalDays += job.daysToDeliver;
        return acc;
      },
      {} as Record<string, { count: number; totalDays: number }>
    );

    const averageDaysByType = {
      foto: byType.foto ? Math.round(byType.foto.totalDays / byType.foto.count) : 0,
      video: byType.video ? Math.round(byType.video.totalDays / byType.video.count) : 0,
      foto_video: byType.foto_video ? Math.round(byType.foto_video.totalDays / byType.foto_video.count) : 0,
    };

    const deliveredOnTime = jobsWithDays.filter((j) => j.isOnTime).length;
    const deliveredLate = totalDelivered - deliveredOnTime;
    const percentOnTime = totalDelivered > 0 ? Math.round((deliveredOnTime / totalDelivered) * 100) : 0;
    const percentLate = totalDelivered > 0 ? Math.round((deliveredLate / totalDelivered) * 100) : 0;

    const taskDone = tasks.filter((t) => t.status === "feito");
    const taskOpen = tasks.length - taskDone.length;
    const taskDoneWithDays = taskDone.map((t) => {
      const created = new Date(t.created_at);
      const completedAt = new Date(t.updated_at);
      const deadline = new Date(t.deadline);
      const daysToComplete = Math.max(
        0,
        Math.ceil((completedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      );
      const isOnTime = completedAt <= deadline;
      return { ...t, completedAt, daysToComplete, isOnTime };
    });

    const taskDoneOnTime = taskDoneWithDays.filter((t) => t.isOnTime).length;
    const taskDoneLate = taskDoneWithDays.length - taskDoneOnTime;
    const taskDaysTotal = taskDoneWithDays.reduce((sum, t) => sum + t.daysToComplete, 0);
    const averageDaysToComplete = taskDoneWithDays.length > 0 ? Math.round(taskDaysTotal / taskDoneWithDays.length) : 0;
    const percentDoneOnTime =
      taskDoneWithDays.length > 0 ? Math.round((taskDoneOnTime / taskDoneWithDays.length) * 100) : 0;

    const { data: taskAssignees } = await supabase
      .from("task_assignees")
      .select("*")
      .eq("account_id", profile.account_id)
      .in(
        "task_id",
        taskDone.map((t) => t.id)
      );

    const doneAssignees = (taskAssignees ?? []) as TaskAssignee[];

    const userById = new Map<string, { id: string; name: string; avatarUrl: string | null; email: string | null }>();
    for (const u of accountUsers) {
      userById.set(u.id, {
        id: u.id,
        name: u.name ?? "Sem nome",
        avatarUrl: u.avatar_url ?? null,
        email: u.email ?? null,
      });
    }

    const manualById = new Map<string, { id: string; name: string; avatarUrl: string | null; email: string }>();
    for (const m of manuals) {
      manualById.set(m.id, {
        id: m.id,
        name: m.name,
        avatarUrl: m.photo_url ?? null,
        email: m.email,
      });
    }

    const manualByEmail = new Map<string, { id: string; name: string; avatarUrl: string | null; email: string }>();
    for (const m of manuals) manualByEmail.set(m.email.toLowerCase(), manualById.get(m.id)!);

    type PerfAgg = {
      id: string;
      name: string;
      avatarUrl: string | null;
      deliveries: number;
      deliveriesDaysTotal: number;
      tasksDone: number;
      tasksDaysTotal: number;
    };

    const perf = new Map<string, PerfAgg>();

    const upsertPerf = (key: string, base: { id: string; name: string; avatarUrl: string | null }) => {
      const existing = perf.get(key);
      if (existing) return existing;
      const init: PerfAgg = {
        id: base.id,
        name: base.name,
        avatarUrl: base.avatarUrl,
        deliveries: 0,
        deliveriesDaysTotal: 0,
        tasksDone: 0,
        tasksDaysTotal: 0,
      };
      perf.set(key, init);
      return init;
    };

    for (const job of jobsWithDays) {
      const refs: Array<{ key: string; id: string; name: string; avatarUrl: string | null }> = [];

      const addUser = (userId: string) => {
        const u = userById.get(userId);
        if (u) refs.push({ key: `user:${u.id}`, id: u.id, name: u.name, avatarUrl: u.avatarUrl });
      };
      const addManual = (manualId: string) => {
        const m = manualById.get(manualId);
        if (m) refs.push({ key: `manual:${m.id}`, id: m.id, name: m.name, avatarUrl: m.avatarUrl });
      };

      if (job.type === "foto" || job.type === "foto_video") {
        if (job.photo_editor_id) addUser(job.photo_editor_id);
        else if (job.photo_manual_assignee_id) addManual(job.photo_manual_assignee_id);
      }

      if (job.type === "video" || job.type === "foto_video") {
        if (job.video_editor_id) addUser(job.video_editor_id);
        else if (job.video_manual_assignee_id) addManual(job.video_manual_assignee_id);
      }

      // fallback: created_by if no editor linked
      if (refs.length === 0 && job.created_by) addUser(job.created_by);

      for (const r of refs) {
        const agg = upsertPerf(r.key, { id: r.id, name: r.name, avatarUrl: r.avatarUrl });
        agg.deliveries += 1;
        agg.deliveriesDaysTotal += job.daysToDeliver;
      }
    }

    const assigneesByTaskId = doneAssignees.reduce((acc, a) => {
      (acc[a.task_id] ??= []).push(a);
      return acc;
    }, {} as Record<string, TaskAssignee[]>);

    for (const t of taskDoneWithDays) {
      const assignees = assigneesByTaskId[t.id] ?? [];
      const refs: Array<{ key: string; id: string; name: string; avatarUrl: string | null }> = [];

      for (const a of assignees) {
        if (a.user_id && userById.has(a.user_id)) {
          const u = userById.get(a.user_id)!;
          refs.push({ key: `user:${u.id}`, id: u.id, name: u.name, avatarUrl: u.avatarUrl });
          continue;
        }
        const email = (a.email ?? "").toLowerCase();
        const manual = email ? manualByEmail.get(email) : undefined;
        if (manual) {
          refs.push({ key: `manual:${manual.id}`, id: manual.id, name: manual.name, avatarUrl: manual.avatarUrl });
        } else {
          refs.push({
            key: `email:${email || a.id}`,
            id: a.id,
            name: a.name || (email ? email : "Responsável"),
            avatarUrl: a.avatar_url ?? null,
          });
        }
      }

      if (refs.length === 0) {
        const u = userById.get(t.created_by);
        if (u) refs.push({ key: `user:${u.id}`, id: u.id, name: u.name, avatarUrl: u.avatarUrl });
      }

      for (const r of refs) {
        const agg = upsertPerf(r.key, { id: r.id, name: r.name, avatarUrl: r.avatarUrl });
        agg.tasksDone += 1;
        agg.tasksDaysTotal += t.daysToComplete;
      }
    }

    const topPerformers: TopPerformer[] = Array.from(perf.values())
      .map((p) => {
        const totalItems = p.deliveries + p.tasksDone;
        const combinedAvg =
          totalItems > 0
            ? (p.deliveriesDaysTotal + p.tasksDaysTotal) / totalItems
            : 0;

        return {
          id: p.id,
          name: p.name,
          avatarUrl: p.avatarUrl,
          averageDays: Math.round(combinedAvg),
          deliveries: p.deliveries,
          tasksDone: p.tasksDone,
        };
      })
      .filter((p) => p.deliveries + p.tasksDone > 0)
      .sort((a, b) => (a.averageDays - b.averageDays) || (b.deliveries + b.tasksDone - (a.deliveries + a.tasksDone)))
      .slice(0, 10);

    const byMonth = jobsWithDays.reduce(
      (acc, job) => {
        const monthKey = new Date(job.deliveredAt).toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "short",
        });
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, total: 0, onTime: 0, late: 0 };
        }
        acc[monthKey].total++;
        if (job.isOnTime) {
          acc[monthKey].onTime++;
        } else {
          acc[monthKey].late++;
        }
        return acc;
      },
      {} as Record<string, { month: string; total: number; onTime: number; late: number }>
    );

    const deliveriesByMonth = Object.values(byMonth).slice(0, 12);

    const byWorkType = jobsWithDays.reduce(
      (acc, job) => {
        const workTypeName = job.job_work_types?.name ?? "Outros";
        if (!acc[workTypeName]) {
          acc[workTypeName] = { workTypeName, count: 0, totalDays: 0 };
        }
        acc[workTypeName].count++;
        acc[workTypeName].totalDays += job.daysToDeliver;
        return acc;
      },
      {} as Record<string, { workTypeName: string; count: number; totalDays: number }>
    );

    const deliveriesByWorkType = Object.values(byWorkType).map((wt) => ({
      workTypeName: wt.workTypeName,
      total: wt.count,
      averageDays: Math.round(wt.totalDays / wt.count),
    }));

    const activeJobs = jobs.filter((j) => !j.stage_id || !finalStages.includes(j.stage_id));
    const currentActiveJobs = activeJobs.length;

    const totalRevisions = jobs.reduce((sum, j) => sum + j.client_revision, 0);
    const averageRevisions = jobs.length > 0 ? parseFloat((totalRevisions / jobs.length).toFixed(1)) : 0;

    const metrics: DeliveryMetrics = {
      averageDaysToDeliver,
      averageDaysByType,
      totalDelivered,
      deliveredOnTime,
      deliveredLate,
      percentOnTime,
      percentLate,
      tasksSummary: {
        total: tasks.length,
        done: taskDone.length,
        open: taskOpen,
        doneOnTime: taskDoneOnTime,
        doneLate: taskDoneLate,
        percentDoneOnTime,
        averageDaysToComplete,
      },
      topPerformers,
      deliveriesByMonth,
      deliveriesByWorkType,
      currentActiveJobs,
      averageRevisions,
    };

    return { ok: true, data: metrics };
  } catch (err) {
    console.error("Error fetching delivery metrics:", err);
    return { ok: false, error: "Erro ao buscar métricas" };
  }
}
