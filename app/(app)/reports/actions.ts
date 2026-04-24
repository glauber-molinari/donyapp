"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type JobWithStage = Job & {
  kanban_stages: { id: string; name: string; is_final: boolean } | null;
  job_work_types: { id: string; name: string } | null;
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

    const { data: allJobs } = await supabase
      .from("jobs")
      .select(
        `
        *,
        kanban_stages (id, name, is_final),
        job_work_types (id, name)
      `
      )
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: false });

    if (!allJobs) {
      return { ok: false, error: "Erro ao carregar dados" };
    }

    const jobs = allJobs as JobWithStage[];

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
