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
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { ActivationChecklist } from "@/components/app/activation-checklist";
import { ContactSearchField } from "@/components/app/contact-search-field";
import { KanbanMiniPreview } from "@/components/app/kanban-mini-preview";
import { useOnboardingTour } from "@/components/app/onboarding-tour";
import { Avatar } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import type { Database, Plan } from "@/types/database";
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
  members: { id: string; name: string; email: string | null; avatarUrl: string | null }[];
  jobs: JobWithRelations[];
  contacts: ContactPick[];
  stages: Pick<Database["public"]["Tables"]["kanban_stages"]["Row"], "id" | "name" | "position">[];
  workTypes: WorkTypeRow[];
  metrics: DashboardMetrics;
  agendaConnected: boolean;
  tourCompleted: boolean;
  plan: Plan;
}

type DateBase = "deadline" | "internal_deadline";
type DashboardTab = "active" | "done";

function clampPage(page: number, maxPage: number) {
  if (maxPage <= 1) return 1;
  return Math.min(Math.max(1, page), maxPage);
}

function deadlineProximity(deadlineIso: string) {
  const days = differenceInCalendarDays(parseISO(deadlineIso), new Date());
  if (Number.isNaN(days)) return { label: "—", tone: "muted" as const, days: null as number | null };
  if (days < 0) return { label: `Atrasado ${Math.abs(days)}d`, tone: "danger" as const, days };
  if (days === 0) return { label: "Hoje", tone: "warn" as const, days };
  if (days <= 3) return { label: `Em ${days}d`, tone: "warn" as const, days };
  if (days <= 10) return { label: `Em ${days}d`, tone: "ok" as const, days };
  return { label: `Em ${days}d`, tone: "muted" as const, days };
}

function ProximityPill({ deadline }: { deadline: string }) {
  const p = deadlineProximity(deadline);
  const base =
    "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums";
  const tone =
    p.tone === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : p.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : p.tone === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-app-border bg-app-sidebar text-ds-muted";

  const progress = (() => {
    if (p.days === null) return 0;
    if (p.days < 0) return 100;
    const capped = Math.min(14, p.days);
    return Math.round(((14 - capped) / 14) * 100);
  })();

  return (
    <span className={cn(base, tone)} title="Quão perto do prazo final está">
      <span className="min-w-[4.25rem]">{p.label}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-black/10">
        <span
          className={cn(
            "block h-full rounded-full",
            p.tone === "danger"
              ? "bg-red-500"
              : p.tone === "warn"
                ? "bg-amber-500"
                : p.tone === "ok"
                  ? "bg-emerald-500"
                  : "bg-ds-subtle/60"
          )}
          style={{ inlineSize: `${progress}%` }}
        />
      </span>
    </span>
  );
}

function AvatarStack({
  people,
  max = 3,
}: {
  people: { id: string; name: string; avatarUrl: string | null }[];
  max?: number;
}) {
  if (people.length === 0) return <span className="text-xs text-ds-subtle">—</span>;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center justify-end">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar
            key={p.id}
            src={p.avatarUrl}
            name={p.name}
            size="sm"
            className="ring-2 ring-app-canvas"
          />
        ))}
        {rest > 0 ? (
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-sidebar text-[0.7rem] font-semibold text-ds-muted ring-1 ring-app-border">
            +{rest}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardView({
  members,
  jobs,
  contacts,
  stages,
  workTypes,
  metrics,
  agendaConnected,
  tourCompleted,
  plan,
}: DashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onboardingTour = useOnboardingTour();

  const attentionParam = searchParams.get("attention");
  const attentionFilter =
    attentionParam === "overdue" || attentionParam === "dueSoon" ? attentionParam : null;

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editJob, setEditJob] = useState<JobWithRelations | null>(null);
  const [deleteJobRow, setDeleteJobRow] = useState<JobWithRelations | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [tab, setTab] = useState<DashboardTab>("active");
  const [dateBase, setDateBase] = useState<DateBase>("deadline");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.name,
      })),
    [members]
  );

  const singleMemberId = members.length === 1 ? members[0]!.id : null;

  function assigneesForJob(j: JobWithRelations) {
    const get = (id: string | null | undefined) => {
      if (!id) return null;
      const m = membersById.get(id);
      if (!m) return null;
      return { id: m.id, name: m.name, avatarUrl: m.avatarUrl };
    };

    if (j.type === "foto_video") {
      const a = get(j.photo_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
      const b = get(j.video_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
      const out = [a, b].filter(
        (x): x is { id: string; name: string; avatarUrl: string | null } => Boolean(x)
      );
      return out.length ? out : [];
    }

    if (j.type === "video") {
      const a = get(j.video_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
      return a ? [a] : [];
    }

    const a = get(j.photo_editor_id) ?? (singleMemberId ? get(singleMemberId) : null);
    return a ? [a] : [];
  }

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
    const toMs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : null;

    return jobs
      .filter((j) => j.kanban_stages)
      .filter((j) => j.job_kind !== "video_edit")
      .filter((j) => (tab === "done" ? Boolean(j.kanban_stages?.is_final) : !j.kanban_stages?.is_final))
      .filter((j) => {
        if (!q) return true;
        const contactName = j.contacts?.name?.toLowerCase() ?? "";
        const stageName = j.kanban_stages?.name?.toLowerCase() ?? "";
        const workTypeName = j.job_work_types?.name?.toLowerCase() ?? "";
        return (
          j.name.toLowerCase().includes(q) ||
          contactName.includes(q) ||
          stageName.includes(q) ||
          workTypeName.includes(q)
        );
      })
      .filter((j) => {
        if (!fromMs && !toMs) return true;
        const raw = (j[dateBase] as string | undefined) ?? "";
        const dt = Date.parse(raw);
        if (!Number.isFinite(dt)) return true;
        if (fromMs && dt < fromMs) return false;
        if (toMs && dt > toMs) return false;
        return true;
      })
      .filter((j) => {
        if (!attentionFilter) return true;
        if (j.kanban_stages?.is_final) return false;
        const prox = deadlineProximity(j.deadline);
        if (attentionFilter === "overdue") return prox.tone === "danger";
        if (attentionFilter === "dueSoon") return prox.tone === "warn";
        return true;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [attentionFilter, dateBase, dateFrom, dateTo, jobs, query, tab]);

  const jobsForChecklist = useMemo(
    () => jobs.filter((j) => j.job_kind !== "video_edit"),
    [jobs],
  );

  const totalItems = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clampPage(page, totalPages);
  const pagedJobs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, pageSize, safePage]);

  useEffect(() => {
    setPage((p) => clampPage(p, totalPages));
  }, [pageSize, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query, tab, dateBase, dateFrom, dateTo, pageSize, attentionFilter]);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#btn-novo-job") return;
    window.requestAnimationFrame(() => {
      document.getElementById("btn-novo-job")?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [pathname]);

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
  const needsAttention = metrics.overdue > 0 || metrics.dueSoon > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {!tourCompleted && onboardingTour ? (
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

      <ActivationChecklist
        contactsCount={contacts.length}
        jobsCount={jobsForChecklist.length}
        stagesSorted={stages.map((s) => ({ id: s.id, position: s.position }))}
        jobs={jobs.map((j) => ({ stage_id: j.stage_id, job_kind: j.job_kind }))}
        agendaConnected={agendaConnected}
        tourCompleted={tourCompleted}
      />

      {plan === "pro" && members.length === 1 ? (
        <Card className="border border-ds-accent/25 bg-ds-cream/40 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-xl bg-white/80 text-ds-accent shadow-sm">
                <UsersRound className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ds-ink">Trabalhe em equipe no Pro</p>
                <p className="mt-1 text-sm text-ds-muted">
                  Convide editores ou produção — menos gargalo, mais entregas no prazo.
                </p>
              </div>
            </div>
            <Link
              href="/settings/team"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-ds-xl border border-app-border bg-app-sidebar px-4 text-sm font-medium text-ds-ink shadow-sm transition-colors hover:bg-ds-cream"
            >
              Convidar agora
            </Link>
          </div>
        </Card>
      ) : null}

      {noStages ? (
        <p className="text-sm text-amber-800" role="status">
          Não há etapas no kanban. Configure o quadro antes de criar jobs.
        </p>
      ) : null}

      {metrics.activeJobs > 0 ? (
        <p className="text-sm text-ds-muted">
          <span className="font-medium text-ds-ink">Neste mês:</span>{" "}
          {metrics.deliveredThisMonth} entrega(s) registrada(s) e {metrics.toEditThisMonth} job(s) com
          edição prevista — ajuste no quadro para não perder o ritmo.
        </p>
      ) : null}

      {needsAttention ? (
        <div
          className="rounded-ds-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 sm:px-5"
          role="status"
        >
          <p className="text-sm font-semibold text-amber-950">
            {metrics.overdue > 0 && metrics.dueSoon > 0
              ? `${metrics.overdue} atrasado(s) e ${metrics.dueSoon} com prazo em até 3 dias.`
              : metrics.overdue > 0
                ? `${metrics.overdue} job(s) atrasado(s) — vale priorizar hoje.`
                : `${metrics.dueSoon} job(s) com prazo apertado nos próximos dias.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {metrics.overdue > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="border-amber-200 bg-white"
                onClick={() => router.push("/dashboard?attention=overdue")}
              >
                Ver atrasados
              </Button>
            ) : null}
            {metrics.dueSoon > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="border-amber-200 bg-white"
                onClick={() => router.push("/dashboard?attention=dueSoon")}
              >
                Ver prazo em até 3 dias
              </Button>
            ) : null}
            <Link
              href="/board"
              className="inline-flex h-8 items-center gap-1 rounded-ds-xl px-3 text-sm font-medium text-amber-950 underline-offset-4 hover:underline"
            >
              Abrir quadro
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {attentionFilter ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                Limpar filtro
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <section aria-label="Métricas do estúdio">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <Card className="hidden p-4 shadow-sm lg:block">
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
          <Card className="hidden p-4 shadow-sm lg:block">
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
        </div>
        <details className="mt-3 rounded-ds-xl border border-app-border bg-app-sidebar/60 px-3 py-2 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium text-ds-ink">Mais indicadores</summary>
          <div className="mt-3 grid grid-cols-2 gap-3 pb-2">
            <Card className="p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-ds-xl bg-emerald-50 p-2 text-emerald-800">
                  <PackageCheck className="h-5 w-5 shrink-0" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums text-ds-ink">
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
                  <p className="text-xl font-bold tabular-nums text-ds-ink">
                    {metrics.toEditThisMonth}
                  </p>
                  <p className="text-xs leading-snug text-ds-muted">A editar neste mês</p>
                </div>
              </div>
            </Card>
          </div>
        </details>
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
        <div className="flex flex-col items-center gap-8">
          <KanbanMiniPreview />
          <EmptyState
            title="Nenhum job ainda"
            description="Em poucos cliques você vê o quadro como na prévia acima: prazos claros e etapas alinhadas."
            className="w-full max-w-lg"
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
              Criar primeiro job
            </Button>
          </EmptyState>
        </div>
      ) : !noStages ? (
        <section className="flex flex-col gap-4" aria-labelledby="dashboard-jobs-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="dashboard-jobs-heading" className="text-lg font-semibold text-ds-ink">
                Lista de jobs
              </h2>
              <p className="text-xs text-ds-subtle">
                {tab === "done"
                  ? "Entregues/concluídos — ficam aqui para não poluir sua fila."
                  : "Ativos — ordenados pelo prazo final mais próximo."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
              <div className="flex w-full flex-col gap-1 sm:w-[22rem]">
                <label htmlFor="dashboard-search" className="text-xs font-medium text-ds-muted">
                  Buscar
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
                    aria-hidden
                  />
                  <input
                    id="dashboard-search"
                    type="search"
                    placeholder="Buscar por job, contato, etapa ou tipo…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
                  />
                </div>
              </div>
              <Select
                id="dashboard-page-size"
                label="Itens"
                name="page_size"
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
                options={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
              />
            </div>
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-full rounded-ds-xl border border-app-border bg-app-sidebar p-1 sm:w-auto">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-ds-xl px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
                      tab === "active"
                        ? "bg-app-canvas text-ds-ink shadow-sm"
                        : "text-ds-muted hover:text-ds-ink"
                    )}
                    onClick={() => setTab("active")}
                    aria-pressed={tab === "active"}
                  >
                    Ativos
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-ds-xl px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
                      tab === "done"
                        ? "bg-app-canvas text-ds-ink shadow-sm"
                        : "text-ds-muted hover:text-ds-ink"
                    )}
                    onClick={() => setTab("done")}
                    aria-pressed={tab === "done"}
                  >
                    Concluídos
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Select
                    id="dashboard-date-base"
                    label="Filtrar por"
                    name="date_base"
                    value={dateBase}
                    onChange={(e) => setDateBase(e.target.value as DateBase)}
                    options={[
                      { value: "deadline", label: "Prazo final" },
                      { value: "internal_deadline", label: "Prazo interno" },
                    ]}
                  />
                  <Input
                    id="dashboard-date-from"
                    type="date"
                    label="De"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    id="dashboard-date-to"
                    type="date"
                    label="Até"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {totalItems === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-ds-muted">
                    {query.trim()
                      ? `Nenhum job encontrado para “${query.trim()}”.`
                      : attentionFilter === "overdue"
                        ? "Nenhum job atrasado na lista atual."
                        : attentionFilter === "dueSoon"
                          ? "Nenhum job ativo com prazo nos próximos 3 dias."
                          : tab === "done"
                            ? "Nenhuma edição concluída ainda."
                            : "Nenhum job ativo na fila — todos podem estar na etapa final."}
                  </p>
                  {attentionFilter ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
                      Limpar filtro de atenção
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-ds-xl border border-app-border lg:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-app-border bg-ds-cream/90">
                          <th className="px-4 py-3 font-medium text-ds-muted">Job</th>
                          <th className="px-4 py-3 font-medium text-ds-muted">Trabalho / entrega</th>
                          <th className="px-4 py-3 font-medium text-ds-muted">Prazos</th>
                          <th className="px-4 py-3 font-medium text-ds-muted">
                            Perto do prazo
                          </th>
                          <th className="px-4 py-3 font-medium text-ds-muted">Etapa</th>
                          <th className="px-4 py-3 font-medium text-ds-muted">Contato</th>
                          <th className="px-4 py-3 text-right font-medium text-ds-muted">
                            Editando
                          </th>
                          <th className="w-28 px-4 py-3 text-right font-medium text-ds-muted">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedJobs.map((j) => {
                          const stageFinal = Boolean(j.kanban_stages?.is_final);
                          const dlBadge = deadlineBadge(j.deadline, stageFinal);
                          const editors = assigneesForJob(j);
                          return (
                            <tr
                              key={j.id}
                              className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                            >
                              <td className="px-4 py-3">
                                <div className="flex min-w-0 flex-col gap-1">
                                  <span className="truncate font-medium text-ds-ink">{j.name}</span>
                                  <span className="text-xs text-ds-subtle">
                                    Criado por{" "}
                                    {j.created_by ? membersById.get(j.created_by)?.name ?? "—" : "—"}
                                  </span>
                                </div>
                              </td>
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
                              <td className="px-4 py-3">
                                <ProximityPill deadline={j.deadline} />
                              </td>
                              <td className="px-4 py-3 text-ds-muted">
                                {j.kanban_stages?.name ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-ds-muted">
                                {j.contacts?.name ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <AvatarStack people={editors} />
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
                    {pagedJobs.map((j) => {
                      const stageFinal = Boolean(j.kanban_stages?.is_final);
                      const dlBadge = deadlineBadge(j.deadline, stageFinal);
                      const editors = assigneesForJob(j);
                      return (
                        <Card key={j.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="font-semibold text-ds-ink">{j.name}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-ds-subtle">
                                  {j.job_work_types?.name ?? "—"}
                                </span>
                                <Badge kind="job-type" value={j.type} />
                                {dlBadge ? <Badge kind="deadline" value={dlBadge} /> : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <ProximityPill deadline={j.deadline} />
                                <div className="ml-auto">
                                  <AvatarStack people={editors} />
                                </div>
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

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-ds-subtle">
                      Mostrando{" "}
                      <span className="font-medium text-ds-ink">
                        {Math.min(totalItems, (safePage - 1) * pageSize + 1)}–
                        {Math.min(totalItems, safePage * pageSize)}
                      </span>{" "}
                      de <span className="font-medium text-ds-ink">{totalItems}</span>
                    </p>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => clampPage(p - 1, totalPages))}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-ds-muted tabular-nums">
                        Página <span className="font-medium text-ds-ink">{safePage}</span> de{" "}
                        <span className="font-medium text-ds-ink">{totalPages}</span>
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => clampPage(p + 1, totalPages))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
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
          {members.length <= 1 ? (
            <>
              <input type="hidden" name="photo_editor_id" value={singleMemberId ?? ""} />
              <input type="hidden" name="video_editor_id" value={singleMemberId ?? ""} />
            </>
          ) : deliveryType === "foto_video" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id="job-create-photo-editor"
                name="photo_editor_id"
                label="Editor (foto)"
                placeholder="Selecione"
                options={memberOptions}
              />
              <Select
                id="job-create-video-editor"
                name="video_editor_id"
                label="Editor (vídeo)"
                placeholder="Selecione"
                options={memberOptions}
              />
            </div>
          ) : (
            <Select
              id="job-create-editor"
              name={deliveryType === "video" ? "video_editor_id" : "photo_editor_id"}
              label="Editor responsável"
              placeholder="Selecione"
              options={memberOptions}
            />
          )}
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
            {members.length <= 1 ? (
              <>
                <input type="hidden" name="photo_editor_id" value={singleMemberId ?? ""} />
                <input type="hidden" name="video_editor_id" value={singleMemberId ?? ""} />
              </>
            ) : editJob.type === "foto_video" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  id="job-edit-photo-editor"
                  name="photo_editor_id"
                  label="Editor (foto)"
                  placeholder="Selecione"
                  defaultValue={editJob.photo_editor_id ?? ""}
                  options={memberOptions}
                />
                <Select
                  id="job-edit-video-editor"
                  name="video_editor_id"
                  label="Editor (vídeo)"
                  placeholder="Selecione"
                  defaultValue={editJob.video_editor_id ?? ""}
                  options={memberOptions}
                />
              </div>
            ) : (
              <Select
                id="job-edit-editor"
                name={editJob.type === "video" ? "video_editor_id" : "photo_editor_id"}
                label="Editor responsável"
                placeholder="Selecione"
                defaultValue={
                  editJob.type === "video"
                    ? (editJob.video_editor_id ?? "")
                    : (editJob.photo_editor_id ?? "")
                }
                options={memberOptions}
              />
            )}
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
