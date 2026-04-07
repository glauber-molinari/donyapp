"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";

import type { JobWithRelations } from "@/app/(app)/dashboard/dashboard-view";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatDeadlinePt } from "@/lib/job-display";

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

export function JobDetailModal({
  job,
  allJobs,
  members,
  open,
  onClose,
}: {
  job: JobWithRelations | null;
  allJobs: JobWithRelations[];
  members: MemberLite[];
  open: boolean;
  onClose: () => void;
}) {
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  if (!open || !job) return null;

  const photoMember = job.photo_editor_id ? membersById.get(job.photo_editor_id) : null;
  const videoMember = job.video_editor_id ? membersById.get(job.video_editor_id) : null;
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
        : (photoMember?.name ?? single?.name ?? "—");
  const videoLine =
    job.job_kind === "video_edit"
      ? (videoMember?.name ?? single?.name ?? "—")
      : job.type === "foto"
        ? "—"
        : (videoMember?.name ?? single?.name ?? "—");

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do job" size="lg" className="max-h-[85vh]">
      <div className="max-h-[min(70vh,560px)] overflow-y-auto pr-1">
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
          <DetailRow label="Prazo interno">{formatOptionalDate(job.internal_deadline)}</DetailRow>
          <DetailRow label="Prazo final">{formatOptionalDate(job.deadline)}</DetailRow>
          <DetailRow label="Responsável (foto)">{photoLine}</DetailRow>
          <DetailRow label="Responsável (vídeo)">{videoLine}</DetailRow>
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
          {job.job_kind === "video_edit" && parentJob ? (
            <DetailRow label="Job principal">{parentJob.name}</DetailRow>
          ) : null}
          {job.job_kind === "standard" && videoSidecar ? (
            <DetailRow label="Card de vídeo">{videoSidecar.name}</DetailRow>
          ) : null}
        </dl>
      </div>
      <p className="mt-4 border-t border-app-border pt-4 text-xs text-ds-muted">
        Para editar dados ou mover etapa, use o{" "}
        <Link href="/dashboard" className="font-medium text-ds-accent hover:underline">
          Dashboard
        </Link>
        .
      </p>
    </Modal>
  );
}
