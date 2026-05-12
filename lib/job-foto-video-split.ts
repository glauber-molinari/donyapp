import type { JobTypeBadgeValue } from "@/components/ui/badge";
import type { JobAssigneeInitialSource } from "@/lib/job-assignee-form";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export type JobFotoVideoListPick = Pick<JobRow, "id" | "type" | "job_kind" | "parent_job_id">;

export function hasVideoEditChild(jobId: string, allJobs: JobFotoVideoListPick[]): boolean {
  return allJobs.some((j) => j.parent_job_id === jobId && j.job_kind === "video_edit");
}

/** Tag na lista: job “combo” legado (`foto_video` + filho) aparece como Foto no card principal. */
export function jobTypeBadgeForList(
  job: JobFotoVideoListPick,
  allJobs: JobFotoVideoListPick[]
): JobTypeBadgeValue {
  if (job.type === "foto_video" && hasVideoEditChild(job.id, allJobs)) return "foto";
  return job.type as JobTypeBadgeValue;
}

/** Valor do select “tipo de entrega” ao editar (combo persistido como `foto` + card de vídeo). */
export function editFormDeliveryType(
  job: JobFotoVideoListPick,
  allJobs: JobFotoVideoListPick[]
): JobRow["type"] {
  if (job.job_kind === "video_edit") return job.type;
  if (job.type === "foto" && hasVideoEditChild(job.id, allJobs)) return "foto_video";
  return job.type;
}

export type JobAssigneeSplitEditPick = JobAssigneeInitialSource &
  Pick<JobRow, "id" | "job_kind" | "parent_job_id">;

/** Tokens de vídeo no formulário vêm do card filho quando o principal já foi dividido. */
export function videoAssigneeSourceForSplitEdit(
  job: JobAssigneeSplitEditPick,
  allJobs: JobAssigneeSplitEditPick[]
): JobAssigneeInitialSource {
  const child = allJobs.find(
    (j) => j.parent_job_id === job.id && j.job_kind === "video_edit"
  );
  if (child && job.job_kind === "standard") {
    return {
      job_assignees: child.job_assignees ?? null,
      photo_editor_id: child.photo_editor_id,
      video_editor_id: child.video_editor_id,
      photo_manual_assignee_id: child.photo_manual_assignee_id,
      video_manual_assignee_id: child.video_manual_assignee_id,
    };
  }
  return job;
}
