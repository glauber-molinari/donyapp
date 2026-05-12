export type JobAssigneeRole = "photo" | "video";

/** Subconjunto do job usado para montar tokens iniciais (evita import circular com a view). */
export type JobAssigneeInitialSource = {
  job_assignees?: Array<{
    user_id: string | null;
    manual_job_assignee_id: string | null;
    role: JobAssigneeRole;
  }> | null;
  photo_editor_id: string | null;
  video_editor_id: string | null;
  photo_manual_assignee_id: string | null;
  video_manual_assignee_id: string | null;
};

export function parseAssigneeToken(raw: string): { kind: "user" | "manual"; id: string } | null {
  const s = raw.trim();
  if (s.startsWith("u:")) {
    const id = s.slice(2).trim();
    return id ? { kind: "user", id } : null;
  }
  if (s.startsWith("m:")) {
    const id = s.slice(2).trim();
    return id ? { kind: "manual", id } : null;
  }
  return null;
}

export function collectAssigneeTokens(formData: FormData, fieldName: string): string[] {
  const raw = formData.getAll(fieldName);
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t && parseAssigneeToken(t)) out.push(t);
  }
  return out;
}

/** Valores iniciais do multi-select a partir de `job_assignees` ou dos campos legados. */
export function initialAssigneeTokensForJob(job: JobAssigneeInitialSource, role: JobAssigneeRole): string[] {
  const rows = job.job_assignees?.filter((r) => r.role === role) ?? [];
  if (rows.length > 0) {
    return rows.map((r) =>
      r.user_id ? `u:${r.user_id}` : `m:${r.manual_job_assignee_id ?? ""}`
    ).filter((t) => !t.endsWith(":"));
  }

  if (role === "photo") {
    const t: string[] = [];
    if (job.photo_manual_assignee_id) t.push(`m:${job.photo_manual_assignee_id}`);
    if (job.photo_editor_id) t.push(`u:${job.photo_editor_id}`);
    return t;
  }
  const t: string[] = [];
  if (job.video_manual_assignee_id) t.push(`m:${job.video_manual_assignee_id}`);
  if (job.video_editor_id) t.push(`u:${job.video_editor_id}`);
  return t;
}
