import type { Database } from "@/types/database";

type JobPick = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  "type" | "job_kind" | "photo_editor_id" | "video_editor_id"
>;

export type JobCardAssignee = { id: string; name: string; avatarUrl: string | null };

/**
 * Avatares no card do Kanban: um responsável por card.
 * — Job `foto_video` (principal): só responsável pela foto (o card de vídeo é outro).
 * — Job `video_edit`: só responsável pela edição de vídeo.
 */
export function assigneesForJobCard(
  job: JobPick,
  membersById: Map<string, JobCardAssignee>,
  singleMemberId: string | null
): JobCardAssignee[] {
  const get = (id: string | null | undefined): JobCardAssignee | null => {
    if (!id) return null;
    return membersById.get(id) ?? null;
  };

  if (job.job_kind === "video_edit") {
    const a = get(job.video_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
    return a ? [a] : [];
  }

  if (job.type === "foto_video") {
    const a = get(job.photo_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
    return a ? [a] : [];
  }

  if (job.type === "video") {
    const a = get(job.video_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
    return a ? [a] : [];
  }

  const a = get(job.photo_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
  return a ? [a] : [];
}
