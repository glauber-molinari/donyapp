import type { Database } from "@/types/database";
import type { JobAssigneeRole } from "@/lib/job-assignee-form";

type JobPick = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  | "type"
  | "job_kind"
  | "photo_editor_id"
  | "video_editor_id"
  | "photo_manual_assignee_id"
  | "video_manual_assignee_id"
>;

export type JobAssigneeRowPick = {
  user_id: string | null;
  manual_job_assignee_id: string | null;
  role: JobAssigneeRole;
};

export type JobCardAssignee = { id: string; name: string; avatarUrl: string | null };

function manualToCard(
  id: string | null | undefined,
  manualById: Map<string, JobCardAssignee>
): JobCardAssignee | null {
  if (!id) return null;
  return manualById.get(id) ?? null;
}

function rowsForCardRole(
  job: JobPick & { job_assignees?: JobAssigneeRowPick[] | null },
  role: "photo" | "video"
): JobAssigneeRowPick[] {
  return (job.job_assignees ?? []).filter((r) => r.role === role);
}

function assigneesFromRows(
  rows: JobAssigneeRowPick[],
  membersById: Map<string, JobCardAssignee>,
  manualById: Map<string, JobCardAssignee>
): JobCardAssignee[] {
  const out: JobCardAssignee[] = [];
  for (const r of rows) {
    if (r.user_id) {
      const u = membersById.get(r.user_id);
      if (u) out.push(u);
    } else if (r.manual_job_assignee_id) {
      const m = manualToCard(r.manual_job_assignee_id, manualById);
      if (m) out.push(m);
    }
  }
  return out;
}

/**
 * Avatares no card do Kanban (vários responsáveis quando cadastrados).
 * — Job `foto_video` (principal): papel `photo` (o card de vídeo é outro).
 * — Job `video_edit`: papel `video`.
 */
export function assigneesForJobCard(
  job: JobPick & { job_assignees?: JobAssigneeRowPick[] | null },
  membersById: Map<string, JobCardAssignee>,
  singleMemberId: string | null,
  manualById?: Map<string, JobCardAssignee>
): JobCardAssignee[] {
  const manual = manualById ?? new Map<string, JobCardAssignee>();

  const getUser = (id: string | null | undefined): JobCardAssignee | null => {
    if (!id) return null;
    return membersById.get(id) ?? null;
  };

  const legacyFallback = (
    manualId: string | null | undefined,
    userId: string | null | undefined
  ): JobCardAssignee[] => {
    const a =
      manualToCard(manualId, manual) ??
      getUser(userId) ??
      (singleMemberId ? getUser(singleMemberId) : null);
    return a ? [a] : [];
  };

  if (job.job_kind === "video_edit") {
    const fromRows = assigneesFromRows(rowsForCardRole(job, "video"), membersById, manual);
    if (fromRows.length > 0) return fromRows;
    return legacyFallback(job.video_manual_assignee_id, job.video_editor_id);
  }

  if (job.type === "foto_video") {
    const fromRows = assigneesFromRows(rowsForCardRole(job, "photo"), membersById, manual);
    if (fromRows.length > 0) return fromRows;
    return legacyFallback(job.photo_manual_assignee_id, job.photo_editor_id);
  }

  if (job.type === "video") {
    const fromRows = assigneesFromRows(rowsForCardRole(job, "video"), membersById, manual);
    if (fromRows.length > 0) return fromRows;
    return legacyFallback(job.video_manual_assignee_id, job.video_editor_id);
  }

  const fromRows = assigneesFromRows(rowsForCardRole(job, "photo"), membersById, manual);
  if (fromRows.length > 0) return fromRows;
  return legacyFallback(job.photo_manual_assignee_id, job.photo_editor_id);
}
