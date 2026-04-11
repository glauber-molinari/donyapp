import type { Database } from "@/types/database";

type JobPick = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  | "type"
  | "job_kind"
  | "photo_editor_id"
  | "video_editor_id"
  | "photo_manual_assignee_id"
  | "video_manual_assignee_id"
>;

export type JobCardAssignee = { id: string; name: string; avatarUrl: string | null };

function manualToCard(
  id: string | null | undefined,
  manualById: Map<string, JobCardAssignee>
): JobCardAssignee | null {
  if (!id) return null;
  return manualById.get(id) ?? null;
}

/**
 * Avatares no card do Kanban: um responsável por card.
 * — Job `foto_video` (principal): só responsável pela foto (o card de vídeo é outro).
 * — Job `video_edit`: só responsável pela edição de vídeo.
 * — Com Pro e responsáveis manuais, prioriza `photo_manual_assignee_id` / `video_manual_assignee_id`.
 */
export function assigneesForJobCard(
  job: JobPick,
  membersById: Map<string, JobCardAssignee>,
  singleMemberId: string | null,
  manualById?: Map<string, JobCardAssignee>
): JobCardAssignee[] {
  const manual = manualById ?? new Map<string, JobCardAssignee>();

  const getUser = (id: string | null | undefined): JobCardAssignee | null => {
    if (!id) return null;
    return membersById.get(id) ?? null;
  };

  if (job.job_kind === "video_edit") {
    const a =
      manualToCard(job.video_manual_assignee_id, manual) ??
      getUser(job.video_editor_id) ??
      (singleMemberId ? getUser(singleMemberId) : null);
    return a ? [a] : [];
  }

  if (job.type === "foto_video") {
    const a =
      manualToCard(job.photo_manual_assignee_id, manual) ??
      getUser(job.photo_editor_id) ??
      (singleMemberId ? getUser(singleMemberId) : null);
    return a ? [a] : [];
  }

  if (job.type === "video") {
    const a =
      manualToCard(job.video_manual_assignee_id, manual) ??
      getUser(job.video_editor_id) ??
      (singleMemberId ? getUser(singleMemberId) : null);
    return a ? [a] : [];
  }

  const a =
    manualToCard(job.photo_manual_assignee_id, manual) ??
    getUser(job.photo_editor_id) ??
    (singleMemberId ? getUser(singleMemberId) : null);
  return a ? [a] : [];
}
