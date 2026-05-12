"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ManualLite = { id: string; name: string; email: string | null };

import type { JobWithRelations } from "@/app/(app)/dashboard/dashboard-view";
import { deleteJob, updateJob } from "@/app/(app)/jobs/actions";
import { NewJobForm } from "@/components/app/new-job-form";
import type { ContactSearchOption } from "@/components/app/contact-search-field";
import type { JobAssigneePickerOption } from "@/lib/build-job-assignee-picker-options";
import { initialAssigneeTokensForJob } from "@/lib/job-assignee-form";
import { formatDeadlinePt } from "@/lib/job-display";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { SelectOption } from "@/components/ui/select";

function formatOptionalDate(ymd: string | null | undefined): string {
  if (!ymd) return "—";
  const slice = ymd.length >= 10 ? ymd.slice(0, 10) : ymd;
  try {
    return formatDeadlinePt(slice);
  } catch {
    return slice;
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-app-border/60 py-2.5 last:border-0 sm:grid-cols-[minmax(7.5rem,32%)_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-ds-subtle">{label}</dt>
      <dd className="text-sm text-ds-ink">{children}</dd>
    </div>
  );
}

type MemberLite = { id: string; name: string; email: string | null; avatarUrl: string | null };

function assigneeNamesForRole(
  job: JobWithRelations,
  role: "photo" | "video",
  membersById: Map<string, MemberLite>,
  manualById: Map<string, ManualLite>,
  single: MemberLite | null
): string {
  const rows = job.job_assignees?.filter((r) => r.role === role) ?? [];
  const names: string[] = [];
  for (const r of rows) {
    if (r.user_id) {
      const m = membersById.get(r.user_id);
      if (m) names.push(m.name);
    } else if (r.manual_job_assignee_id) {
      const m = manualById.get(r.manual_job_assignee_id);
      if (m) names.push(m.name);
    }
  }
  if (names.length > 0) return names.join(", ");

  const photoManual = job.photo_manual_assignee_id
    ? manualById.get(job.photo_manual_assignee_id)
    : null;
  const videoManual = job.video_manual_assignee_id
    ? manualById.get(job.video_manual_assignee_id)
    : null;
  const photoMember = job.photo_editor_id ? membersById.get(job.photo_editor_id) : null;
  const videoMember = job.video_editor_id ? membersById.get(job.video_editor_id) : null;

  if (role === "photo") {
    return photoManual?.name ?? photoMember?.name ?? single?.name ?? "—";
  }
  return videoManual?.name ?? videoMember?.name ?? single?.name ?? "—";
}

const DETAIL_TABS = [
  { id: "geral" as const, label: "Informações gerais" },
  { id: "prazos" as const, label: "Prazos" },
  { id: "equipe" as const, label: "Equipe" },
  { id: "extras" as const, label: "Extras" },
];

type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

export function JobDetailModal({
  job,
  allJobs,
  members,
  manualAssignees,
  contacts,
  stageOptions,
  workTypeOptions,
  assigneePickerOptions,
  open,
  onClose,
}: {
  job: JobWithRelations | null;
  allJobs: JobWithRelations[];
  members: MemberLite[];
  manualAssignees: ManualLite[];
  contacts: ContactSearchOption[];
  stageOptions: SelectOption[];
  workTypeOptions: SelectOption[];
  assigneePickerOptions: JobAssigneePickerOption[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<DetailTabId>("geral");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const manualById = useMemo(() => new Map(manualAssignees.map((m) => [m.id, m])), [manualAssignees]);

  useEffect(() => {
    if (job?.id) {
      setTab("geral");
      setConfirmDelete(false);
      setEditing(false);
    }
  }, [job?.id]);

  if (!open || !job) return null;

  const single = members.length === 1 ? members[0]! : null;

  const parentJob = job.parent_job_id
    ? allJobs.find((j) => j.id === job.parent_job_id)
    : null;
  const videoSidecar = allJobs.find(
    (j) => j.parent_job_id === job.id && j.job_kind === "video_edit"
  );

  const photoLine =
    job.job_kind === "video_edit"
      ? "—"
      : job.type === "video"
        ? "—"
        : assigneeNamesForRole(job, "photo", membersById, manualById, single);
  const videoLine =
    job.job_kind === "video_edit"
      ? assigneeNamesForRole(job, "video", membersById, manualById, single)
      : job.type === "foto"
        ? "—"
        : assigneeNamesForRole(job, "video", membersById, manualById, single);

  const jobId = job.id;

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await updateJob(jobId, fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Job atualizado.");
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const editFormId = `job-edit-${job.id}-form`;

  const modalFooter = editing ? (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditing(false)}
        disabled={saving}
      >
        Fechar
      </Button>
      <Button form={editFormId} type="submit" size="sm" disabled={saving}>
        {saving ? "Salvando…" : "Salvar alterações"}
      </Button>
    </div>
  ) : confirmDelete ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={deleting}
        onClick={async () => {
          setDeleting(true);
          const res = await deleteJob(job.id);
          setDeleting(false);
          if (!res.ok) {
            toast.error(res.error);
            setConfirmDelete(false);
            return;
          }
          toast.success("Job excluído.");
          onClose();
          router.refresh();
        }}
      >
        {deleting ? "Excluindo…" : "Confirmar exclusão"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deleting}
        onClick={() => setConfirmDelete(false)}
      >
        Cancelar
      </Button>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Excluir
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar job" : "Detalhes do job"}
      size="lg"
      footer={modalFooter}
    >
      {editing ? (
        <div className="p-5">
          <NewJobForm
            formId={editFormId}
            fieldIdPrefix={`job-edit-${job.id}`}
            contacts={contacts}
            stageOptions={stageOptions}
            workTypeOptions={workTypeOptions}
            assigneePickerOptions={assigneePickerOptions}
            initialAssigneePhotoTokens={initialAssigneeTokensForJob(job, "photo")}
            initialAssigneeVideoTokens={initialAssigneeTokensForJob(job, "video")}
            initialValues={{
              name: job.name,
              stage_id: job.stage_id,
              job_date: job.job_date,
              contact_id: job.contact_id,
              work_type_id: job.work_type_id,
              sd_card_tags: job.sd_card_tags ?? [],
              notes: job.notes,
              internal_deadline: job.internal_deadline,
              deadline: job.deadline,
              type: job.type,
              delivery_link: job.delivery_link,
              photo_editor_id: job.photo_editor_id,
              video_editor_id: job.video_editor_id,
              photo_manual_assignee_id: job.photo_manual_assignee_id,
              video_manual_assignee_id: job.video_manual_assignee_id,
            }}
            onSubmit={handleEditSubmit}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5">
          <div
            role="tablist"
            aria-label="Seções dos detalhes"
            className="-mx-1 flex shrink-0 flex-wrap gap-1 px-1"
          >
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-ds-lg px-3 py-2.5 min-h-[44px] text-left text-xs font-medium transition sm:text-sm",
                  tab === t.id
                    ? "bg-ds-cream text-ds-ink shadow-sm"
                    : "text-ds-subtle hover:bg-ds-cream/60 hover:text-ds-ink"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {tab === "geral" ? (
              <dl>
                <DetailRow label="Nome">{job.name}</DetailRow>
                <DetailRow label="Coluna">{job.kanban_stages?.name ?? "—"}</DetailRow>
                <DetailRow label="Data job">{formatOptionalDate(job.job_date)}</DetailRow>
                <DetailRow label="Cliente">
                  {job.contacts ? (
                    <>
                      {job.contacts.name}
                      {job.contacts.email ? (
                        <span className="mt-0.5 block text-xs text-ds-muted">{job.contacts.email}</span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Tipo do job">{job.job_work_types?.name ?? "—"}</DetailRow>
                <DetailRow label="Tipo de entrega">
                  <Badge kind="job-type" value={job.type} />
                </DetailRow>
                <DetailRow label="Cartão SD">
                  {(job.sd_card_tags ?? []).length > 0 ? (
                    <span className="flex flex-wrap gap-1.5">
                      {(job.sd_card_tags ?? []).map((t, i) => (
                        <span
                          key={`${i}-${t}`}
                          className="rounded-md bg-ds-cream px-2 py-0.5 text-xs font-medium text-ds-ink"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-ds-muted">—</span>
                  )}
                </DetailRow>
                {job.job_kind === "video_edit" && parentJob ? (
                  <DetailRow label="Job principal">{parentJob.name}</DetailRow>
                ) : null}
                {job.job_kind === "standard" && videoSidecar ? (
                  <DetailRow label="Card de vídeo">{videoSidecar.name}</DetailRow>
                ) : null}
              </dl>
            ) : null}

            {tab === "prazos" ? (
              <dl>
                <DetailRow label="Prazo interno">{formatOptionalDate(job.internal_deadline)}</DetailRow>
                <DetailRow label="Prazo final">{formatOptionalDate(job.deadline)}</DetailRow>
              </dl>
            ) : null}

            {tab === "equipe" ? (
              <dl>
                <DetailRow label="Responsáveis (foto)">{photoLine}</DetailRow>
                <DetailRow label="Responsáveis (vídeo)">{videoLine}</DetailRow>
              </dl>
            ) : null}

            {tab === "extras" ? (
              <dl>
                <DetailRow label="Alteração cliente">{job.client_revision ?? 0}</DetailRow>
                <DetailRow label="Observações">
                  {job.notes?.trim() ? (
                    <span className="whitespace-pre-wrap">{job.notes}</span>
                  ) : (
                    <span className="text-ds-muted">—</span>
                  )}
                </DetailRow>
                <DetailRow label="Link entrega">
                  {job.delivery_link ? (
                    <a
                      href={job.delivery_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ds-accent hover:underline"
                    >
                      Abrir link
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-ds-muted">—</span>
                  )}
                </DetailRow>
              </dl>
            ) : null}
          </div>

        </div>
      )}
    </Modal>
  );
}
