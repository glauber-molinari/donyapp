"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ManualLite = { id: string; name: string; email: string | null };

import type { JobWithRelations } from "@/app/(app)/dashboard/dashboard-view";
import { deleteJob } from "@/app/(app)/jobs/actions";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDeadlinePt } from "@/lib/job-display";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

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
  open,
  onClose,
}: {
  job: JobWithRelations | null;
  allJobs: JobWithRelations[];
  members: MemberLite[];
  manualAssignees: ManualLite[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<DetailTabId>("geral");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const manualById = useMemo(() => new Map(manualAssignees.map((m) => [m.id, m])), [manualAssignees]);

  useEffect(() => {
    if (job?.id) {
      setTab("geral");
      setConfirmDelete(false);
    }
  }, [job?.id]);

  if (!open || !job) return null;

  const photoMember = job.photo_editor_id ? membersById.get(job.photo_editor_id) : null;
  const videoMember = job.video_editor_id ? membersById.get(job.video_editor_id) : null;
  const single = members.length === 1 ? members[0]! : null;

  const photoManual = job.photo_manual_assignee_id
    ? manualById.get(job.photo_manual_assignee_id)
    : null;
  const videoManual = job.video_manual_assignee_id
    ? manualById.get(job.video_manual_assignee_id)
    : null;

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
        : (photoManual?.name ?? photoMember?.name ?? single?.name ?? "—");
  const videoLine =
    job.job_kind === "video_edit"
      ? (videoManual?.name ?? videoMember?.name ?? single?.name ?? "—")
      : job.type === "foto"
        ? "—"
        : (videoManual?.name ?? videoMember?.name ?? single?.name ?? "—");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalhes do job"
      size="lg"
      className="max-h-[min(92vh,720px)] overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
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

        <div
          role="tabpanel"
          className="min-h-0 max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain pr-1 sm:max-h-[min(50vh,380px)]"
        >
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
              <DetailRow label="Responsável (foto)">{photoLine}</DetailRow>
              <DetailRow label="Responsável (vídeo)">{videoLine}</DetailRow>
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

        <div className="shrink-0 border-t border-app-border pt-3">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-800">
                Excluir <strong>{job.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
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
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Excluindo…" : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md border border-app-border px-3 py-1.5 text-xs font-medium text-ds-ink hover:bg-ds-cream disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-ds-muted">
                Para editar dados ou mover etapa, use o{" "}
                <Link href="/dashboard" className="font-medium text-ds-accent hover:underline">
                  Dashboard
                </Link>
                .
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
