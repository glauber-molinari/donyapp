"use client";

import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ContactSearchField } from "@/components/app/contact-search-field";
import { useOnboardingTour } from "@/components/app/onboarding-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { deadlineBadge, formatDeadlinePt } from "@/lib/job-display";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/database";
import { createJob, deleteJob, updateJob } from "../jobs/actions";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type ContactPick = Pick<Database["public"]["Tables"]["contacts"]["Row"], "id" | "name" | "email">;
type StagePick = Pick<
  Database["public"]["Tables"]["kanban_stages"]["Row"],
  "id" | "name" | "position" | "is_final"
>;
type WorkTypeRow = Database["public"]["Tables"]["job_work_types"]["Row"];

export type JobWithRelations = JobRow & {
  contacts: ContactPick | null;
  kanban_stages: StagePick | null;
  job_work_types: Pick<WorkTypeRow, "id" | "name"> | null;
};

const JOB_DELIVERY_OPTIONS: { value: JobRow["type"]; label: string }[] = [
  { value: "foto", label: "Foto" },
  { value: "video", label: "Vídeo" },
  { value: "foto_video", label: "Foto e Vídeo" },
];

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DashboardViewProps {
  jobs: JobWithRelations[];
  contacts: ContactPick[];
  stages: Pick<Database["public"]["Tables"]["kanban_stages"]["Row"], "id" | "name" | "position">[];
  workTypes: WorkTypeRow[];
  metrics: DashboardMetrics;
}

export function DashboardView({ jobs, contacts, stages, workTypes, metrics }: DashboardViewProps) {
  const router = useRouter();
  const onboardingTour = useOnboardingTour();

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobWithRelations | null>(null);
  const [deleteJobRow, setDeleteJobRow] = useState<JobWithRelations | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const stageOptions = useMemo(
    () =>
      [...stages]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ value: s.id, label: s.name })),
    [stages]
  );

  const workTypeOptions = useMemo(
    () =>
      [...workTypes]
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
        .map((w) => ({ value: w.id, label: w.name })),
    [workTypes]
  );

  const [deliveryType, setDeliveryType] = useState<JobRow["type"]>("foto");

  useEffect(() => {
    if (createOpen) setDeliveryType("foto");
  }, [createOpen]);

  /** Jobs não finais, prazo mais próximo primeiro. Sem busca: até 5; com busca: todos os que batem no filtro. */
  const upcomingDisplay = useMemo(() => {
    const activeSorted = jobs
      .filter(
        (j) =>
          j.kanban_stages &&
          !j.kanban_stages.is_final &&
          j.job_kind !== "video_edit"
      )
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    const q = query.trim().toLowerCase();
    if (!q) {
      return activeSorted.slice(0, 5);
    }
    return activeSorted.filter((j) => {
      const contactName = j.contacts?.name?.toLowerCase() ?? "";
      const stageName = j.kanban_stages?.name?.toLowerCase() ?? "";
      return (
        j.name.toLowerCase().includes(q) ||
        contactName.includes(q) ||
        stageName.includes(q)
      );
    });
  }, [jobs, query]);

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await createJob(fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setCreateOpen(false);
      form.reset();
      toast.success("Job criado.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editJob) return;
    const fd = new FormData(e.currentTarget);
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await updateJob(editJob.id, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setEditJob(null);
      toast.success("Job atualizado.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteJobRow) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await deleteJob(deleteJobRow.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setDeleteJobRow(null);
      toast.success("Job excluído.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  const noStages = stageOptions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {onboardingTour ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => onboardingTour.startTour()}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Ver tour guiado
            </Button>
          ) : null}
          <Button
            id="btn-novo-job"
            type="button"
            size="md"
            className="w-full sm:w-auto"
            disabled={noStages}
            onClick={() => {
              setErrorMessage(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo job
          </Button>
        </div>
      </div>

      {noStages ? (
        <p className="text-sm text-amber-800" role="status">
          Não há etapas no kanban. Configure o quadro antes de criar jobs.
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Métricas do estúdio">
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-ds-xl bg-ds-cream/90 p-2 text-ds-accent">
              <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-ds-ink">{metrics.activeJobs}</p>
              <p className="text-xs leading-snug text-ds-muted">Jobs ativos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-ds-xl bg-red-50 p-2 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-ds-ink">{metrics.overdue}</p>
              <p className="text-xs leading-snug text-ds-muted">Atrasados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-ds-xl bg-amber-50 p-2 text-amber-800">
              <CalendarClock className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-ds-ink">{metrics.dueSoon}</p>
              <p className="text-xs leading-snug text-ds-muted">Prazo em até 3 dias</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-ds-xl bg-emerald-50 p-2 text-emerald-800">
              <PackageCheck className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-ds-ink">
                {metrics.deliveredThisMonth}
              </p>
              <p className="text-xs leading-snug text-ds-muted">Entregues no mês</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-ds-xl bg-sky-50 p-2 text-sky-800">
              <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-ds-ink">
                {metrics.toEditThisMonth}
              </p>
              <p className="text-xs leading-snug text-ds-muted">A editar neste mês</p>
            </div>
          </div>
        </Card>
      </section>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <EmptyState
          title="Nenhum job ainda"
          description="Cadastre trabalhos de edição com prazo, tipo e observações."
        >
          <Button
            type="button"
            disabled={noStages}
            onClick={() => {
              setErrorMessage(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo job
          </Button>
        </EmptyState>
      ) : !noStages ? (
        <section className="flex flex-col gap-4" aria-labelledby="dashboard-urgent-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 id="dashboard-urgent-heading" className="text-lg font-semibold text-ds-ink">
              Próximos prazos
            </h2>
            <div className="relative w-full sm:ml-auto sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Buscar por nome, contato ou etapa…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
                aria-label="Buscar jobs"
              />
            </div>
          </div>

          {upcomingDisplay.length === 0 ? (
            <p className="text-sm text-ds-muted">
              {query.trim()
                ? `Nenhum job encontrado para “${query.trim()}”.`
                : "Nenhum job ativo na fila — todos podem estar na etapa final."}
            </p>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-ds-xl border border-app-border lg:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-app-border bg-ds-cream/90">
                      <th className="px-4 py-3 font-medium text-ds-muted">Nome</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Trabalho / entrega</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Prazos</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Etapa</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Contato</th>
                      <th className="w-28 px-4 py-3 text-right font-medium text-ds-muted">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingDisplay.map((j) => {
                      const stageFinal = Boolean(j.kanban_stages?.is_final);
                      const dlBadge = deadlineBadge(j.deadline, stageFinal);
                      return (
                        <tr
                          key={j.id}
                          className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                        >
                          <td className="px-4 py-3 font-medium text-ds-ink">{j.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-ds-muted">
                                {j.job_work_types?.name ?? "—"}
                              </span>
                              <Badge kind="job-type" value={j.type} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-ds-muted">
                                  Final {formatDeadlinePt(j.deadline)}
                                </span>
                                {dlBadge ? <Badge kind="deadline" value={dlBadge} /> : null}
                              </div>
                              <span className="text-xs text-ds-subtle">
                                Interno {formatDeadlinePt(j.internal_deadline)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-ds-muted">
                            {j.kanban_stages?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-ds-muted">
                            {j.contacts?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {j.delivery_link ? (
                                <a
                                  href={j.delivery_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Abrir material final de ${j.name}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-ds-xl text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              ) : null}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label={`Editar ${j.name}`}
                                onClick={() => {
                                  setErrorMessage(null);
                                  setEditJob(j);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                aria-label={`Excluir ${j.name}`}
                                onClick={() => {
                                  setErrorMessage(null);
                                  setDeleteJobRow(j);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 lg:hidden">
                {upcomingDisplay.map((j) => {
                  const stageFinal = Boolean(j.kanban_stages?.is_final);
                  const dlBadge = deadlineBadge(j.deadline, stageFinal);
                  return (
                    <Card key={j.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="font-semibold text-ds-ink">{j.name}</p>
                          <p className="text-xs text-ds-subtle">{j.job_work_types?.name ?? "—"}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge kind="job-type" value={j.type} />
                            {dlBadge ? <Badge kind="deadline" value={dlBadge} /> : null}
                          </div>
                          <p className="text-sm text-ds-muted">
                            Final: {formatDeadlinePt(j.deadline)}
                          </p>
                          <p className="text-sm text-ds-muted">
                            Interno: {formatDeadlinePt(j.internal_deadline)}
                          </p>
                          <p className="text-sm text-ds-muted">
                            Contato: {j.contacts?.name ?? "—"}
                          </p>
                          <p className="text-sm text-ds-subtle">
                            Etapa: {j.kanban_stages?.name ?? "—"}
                          </p>
                          {j.delivery_link ? (
                            <a
                              href={j.delivery_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-ds-accent"
                            >
                              Material final
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </a>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Editar ${j.name}`}
                            onClick={() => {
                              setErrorMessage(null);
                              setEditJob(j);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            aria-label={`Excluir ${j.name}`}
                            onClick={() => {
                              setErrorMessage(null);
                              setDeleteJobRow(j);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </section>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo job"
        size="lg"
      >
        <form className="flex flex-col gap-4" onSubmit={handleCreate}>
          <Select
            id="job-create-stage"
            name="stage_id"
            label="Coluna inicial"
            required
            placeholder="Selecione a etapa"
            options={stageOptions}
          />
          <Input id="job-create-name" name="name" label="Título do job" required />
          <ContactSearchField
            id="job-create-contact"
            contacts={contacts}
            resetKey={createOpen ? "1" : "0"}
          />
          <Select
            id="job-create-work-type"
            name="work_type_id"
            label="Tipo de trabalho"
            required={workTypeOptions.length > 0}
            placeholder={workTypeOptions.length ? "Selecione" : "Cadastre tipos em Configurações"}
            options={workTypeOptions}
            disabled={workTypeOptions.length === 0}
          />
          {workTypeOptions.length === 0 ? (
            <p className="text-xs text-amber-800">
              Adicione tipos de trabalho em <strong>Configurações → Kanban</strong>.
            </p>
          ) : null}
          <Input
            id="job-create-internal"
            name="internal_deadline"
            type="date"
            label="Prazo interno"
            required
            defaultValue={todayYmd()}
          />
          <Input
            id="job-create-final"
            name="deadline"
            type="date"
            label="Prazo final"
            required
            defaultValue={todayYmd()}
          />
          <Select
            id="job-create-delivery-type"
            name="type"
            label="Tipo de entrega"
            required
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as JobRow["type"])}
            options={JOB_DELIVERY_OPTIONS}
          />
          {deliveryType === "video" || deliveryType === "foto_video" ? (
            <div className="rounded-ds-xl border border-sky-200 bg-sky-50/90 p-4">
              <p className="text-sm font-semibold text-sky-950">Edição de vídeo</p>
              <p className="mt-1 text-xs text-sky-900/85">
                Será criado um card adicional no quadro só para acompanhar a edição de vídeo deste
                job.
              </p>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || workTypeOptions.length === 0}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editJob)}
        onClose={() => setEditJob(null)}
        title="Editar job"
        size="lg"
      >
        {editJob ? (
          <form
            key={editJob.id}
            className="flex flex-col gap-4"
            onSubmit={handleEdit}
          >
            <Input
              id="job-edit-name"
              name="name"
              label="Título do job"
              required
              defaultValue={editJob.name}
            />
            <Select
              id="job-edit-work-type"
              name="work_type_id"
              label="Tipo de trabalho"
              required
              defaultValue={editJob.work_type_id}
              options={workTypeOptions}
            />
            <Select
              id="job-edit-type"
              name="type"
              label="Tipo de entrega"
              required
              defaultValue={editJob.type}
              options={JOB_DELIVERY_OPTIONS}
            />
            <Input
              id="job-edit-internal"
              name="internal_deadline"
              type="date"
              label="Prazo interno"
              required
              defaultValue={editJob.internal_deadline.slice(0, 10)}
            />
            <Input
              id="job-edit-deadline"
              name="deadline"
              type="date"
              label="Prazo final"
              required
              defaultValue={editJob.deadline.slice(0, 10)}
            />
            <ContactSearchField
              id="job-edit-contact"
              contacts={contacts}
              defaultContactId={editJob.contact_id}
              resetKey={editJob.id}
            />
            <Select
              id="job-edit-stage"
              name="stage_id"
              label="Etapa no kanban"
              required
              defaultValue={editJob.stage_id ?? ""}
              options={stageOptions}
            />
            <Textarea
              id="job-edit-notes"
              name="notes"
              label="Observações"
              placeholder="Opcional"
              rows={3}
              defaultValue={editJob.notes ?? ""}
            />
            <Input
              id="job-edit-delivery"
              name="delivery_link"
              type="url"
              label="Link do material final"
              placeholder="https://…"
              defaultValue={editJob.delivery_link ?? ""}
            />
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditJob(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteJobRow)}
        onClose={() => setDeleteJobRow(null)}
        title="Excluir job"
        size="sm"
      >
        {deleteJobRow ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ds-muted">
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-ds-ink">{deleteJobRow.name}</span>? Esta ação não
              pode ser desfeita.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteJobRow(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
