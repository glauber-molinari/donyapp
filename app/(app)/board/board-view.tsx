"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { JobWithRelations } from "../dashboard/dashboard-view";
import {
  createJob,
  syncKanbanState,
  updateJobClientRevision,
  type KanbanColumnSync,
} from "../jobs/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { kanbanStageAccentHex } from "@/lib/kanban-stage-accent";
import { assigneesForJobCard } from "@/lib/job-assignees";
import {
  deadlineTimelineAriaText,
  deadlineTimelineVisual,
  formatDeadlinePt,
} from "@/lib/job-display";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Database, Plan } from "@/types/database";

type StageRow = Database["public"]["Tables"]["kanban_stages"]["Row"];
type WorkTypeRow = Database["public"]["Tables"]["job_work_types"]["Row"];
type ContactPick = Pick<Database["public"]["Tables"]["contacts"]["Row"], "id" | "name" | "email">;

const JobDetailModal = dynamic(
  () => import("@/components/app/job-detail-modal").then((m) => ({ default: m.JobDetailModal })),
  { ssr: false, loading: () => null }
);

const NewJobForm = dynamic(
  () => import("@/components/app/new-job-form").then((m) => ({ default: m.NewJobForm })),
  { ssr: false, loading: () => null }
);

const DeliveryEmailModal = dynamic(
  () => import("@/components/app/delivery-email-modal").then((m) => ({ default: m.DeliveryEmailModal })),
  { ssr: false, loading: () => null }
);

/** YYYY-MM do mês corrente (fuso local). */
function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastYmdOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return `${ym}-31`;
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/** Prazo (YYYY-MM-DD) cai dentro do mês YYYY-MM. */
function ymdInCalendarMonth(ymd: string, ym: string): boolean {
  const start = `${ym}-01`;
  const end = lastYmdOfMonth(ym);
  return ymd >= start && ymd <= end;
}

function updatedAtInCalendarMonth(iso: string, ym: string): boolean {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return false;
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/**
 * Job aparece no quadro do mês se o prazo interno ou final cair naquele mês,
 * ou (entregue) se tiver sido atualizado na etapa final naquele mês.
 */
function jobVisibleInBoardMonth(job: JobWithRelations, ym: string): boolean {
  if (ymdInCalendarMonth(job.deadline, ym) || ymdInCalendarMonth(job.internal_deadline, ym)) {
    return true;
  }
  const isFinal = job.kanban_stages?.is_final === true;
  if (isFinal && updatedAtInCalendarMonth(job.updated_at, ym)) {
    return true;
  }
  return false;
}

const CLIENT_REVISION_OPTIONS = [0, 1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: n === 0 ? "0 (sem alteração)" : `${n}ª alteração`,
}));

const ClientRevisionSelect = memo(function ClientRevisionSelect({ job }: { job: JobWithRelations }) {
  const router = useRouter();
  const [value, setValue] = useState(String(job.client_revision ?? 0));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(String(job.client_revision ?? 0));
  }, [job.client_revision, job.id]);

  return (
    <div
      className="mt-1.5"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <label htmlFor={`client-revision-${job.id}`} className="sr-only">
        Alteração do cliente (0 a 5)
      </label>
      <select
        id={`client-revision-${job.id}`}
        disabled={pending}
        value={value}
        aria-label="Número da alteração pedida pelo cliente"
        onClick={(e) => e.stopPropagation()}
        onChange={async (e) => {
          const next = e.target.value;
          const num = Number(next);
          setValue(next);
          setPending(true);
          const res = await updateJobClientRevision(job.id, num);
          setPending(false);
          if (!res.ok) {
            setValue(String(job.client_revision ?? 0));
            toast.error(res.error);
            return;
          }
          router.refresh();
        }}
        className="w-full rounded-md border border-app-border bg-app-sidebar px-2 py-1 text-[11px] text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20 disabled:opacity-60"
      >
        {CLIENT_REVISION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});

function buildColumnItemsFromJobs(
  jobList: JobWithRelations[],
  stageIds: string[]
): Record<string, string[]> {
  const map: Record<string, JobWithRelations[]> = {};
  for (const id of stageIds) map[id] = [];
  for (const j of jobList) {
    if (!j.stage_id || !Object.prototype.hasOwnProperty.call(map, j.stage_id)) continue;
    map[j.stage_id].push(j);
  }
  const out: Record<string, string[]> = {};
  for (const sid of stageIds) {
    const list = map[sid] ?? [];
    list.sort((a, b) => {
      const pa = a.position ?? 0;
      const pb = b.position ?? 0;
      if (pa !== pb) return pa - pb;
      return a.deadline.localeCompare(b.deadline);
    });
    out[sid] = list.map((j) => j.id);
  }
  return out;
}

function applyDragEnd(
  prev: Record<string, string[]>,
  event: DragEndEvent,
  stageIdsOrdered: string[]
): Record<string, string[]> | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;

  const activeId = String(active.id);
  const overId = String(over.id);

  // Mapa local para evitar varreduras repetidas em colunas grandes
  const jobIdToStageId = new Map<string, string>();
  for (const [sid, ids] of Object.entries(prev)) {
    for (const id of ids) jobIdToStageId.set(id, sid);
  }

  const activeContainer = jobIdToStageId.get(activeId);
  let overContainer = jobIdToStageId.get(overId);
  if (!overContainer && overId.startsWith("stage-")) {
    overContainer = overId.slice("stage-".length);
  }
  if (!activeContainer || !overContainer) return null;

  // Mantém referência das colunas não afetadas para reduzir re-renders
  const next: Record<string, string[]> = { ...prev };
  for (const sid of stageIdsOrdered) {
    if (!next[sid]) next[sid] = [];
  }

  if (activeContainer === overContainer) {
    const itemsPrev = prev[activeContainer] ?? [];
    const oldIndex = itemsPrev.indexOf(activeId);
    const newIndex = itemsPrev.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return null;
    next[activeContainer] = arrayMove(itemsPrev, oldIndex, newIndex);
    return next;
  }

  const sourcePrev = prev[activeContainer] ?? [];
  const destPrev = prev[overContainer] ?? [];
  const source = [...sourcePrev];
  const dest = [...destPrev];
  const fromIndex = source.indexOf(activeId);
  if (fromIndex === -1) return null;
  source.splice(fromIndex, 1);

  let insertIndex: number;
  if (overId.startsWith("stage-")) {
    insertIndex = dest.length;
  } else {
    const overIndex = dest.indexOf(overId);
    insertIndex = overIndex >= 0 ? overIndex : dest.length;
  }
  dest.splice(insertIndex, 0, activeId);

  next[activeContainer] = source;
  next[overContainer] = dest;
  return next;
}

function toKanbanMoves(
  columns: Record<string, string[]>,
  stageIdsOrdered: string[]
): KanbanColumnSync[] {
  return stageIdsOrdered.map((stageId) => ({
    stageId,
    jobIdsOrdered: columns[stageId] ?? [],
  }));
}

function cloneColumnIds(prev: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(prev)) {
    out[k] = [...prev[k]];
  }
  return out;
}

function jobMatchesQuery(job: JobWithRelations | undefined, q: string): boolean {
  if (!job) return false;
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return (
    job.name.toLowerCase().includes(t) ||
    (job.contacts?.name?.toLowerCase().includes(t) ?? false) ||
    (job.job_work_types?.name?.toLowerCase().includes(t) ?? false)
  );
}

interface BoardViewProps {
  jobs: JobWithRelations[];
  stages: StageRow[];
  contacts: ContactPick[];
  workTypes: WorkTypeRow[];
  plan: Plan;
  members: { id: string; name: string; email: string | null; avatarUrl: string | null }[];
  manualAssignees: { id: string; name: string; email: string | null; photo_url: string | null }[];
  senderName: string | null;
  replyToEmail: string | null;
  accountSubjectTemplate: string | null;
  accountBodyTemplate: string | null;
}

const AvatarStack = memo(function AvatarStack({
  people,
  max = 2,
}: {
  people: { id: string; name: string; avatarUrl: string | null }[];
  max?: number;
}) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((p) => (
          <Avatar
            key={p.id}
            src={p.avatarUrl}
            name={p.name}
            size="xs"
            className="ring-2 ring-white"
          />
        ))}
        {rest > 0 ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[9px] font-semibold text-ds-muted ring-2 ring-white">
            +{rest}
          </div>
        ) : null}
      </div>
    </div>
  );
});

const DeadlineTimelineBar = memo(function DeadlineTimelineBar({
  job,
  stageFinal,
}: {
  job: JobWithRelations;
  stageFinal: boolean;
}) {
  const { fillPct, tone } = deadlineTimelineVisual(job.deadline, stageFinal);
  const barClass =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "ok"
          ? "bg-emerald-500"
          : tone === "done"
            ? "bg-emerald-600/45"
            : "bg-stone-400/60";

  return (
    <div
      className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-200/90"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fillPct}
      aria-valuetext={deadlineTimelineAriaText(tone)}
      aria-label="Proximidade do prazo final"
    >
      <span
        className={cn("block h-full max-w-full rounded-full transition-[width]", barClass)}
        style={{ width: `${fillPct}%` }}
      />
    </div>
  );
});

const JobCardContent = memo(function JobCardContent({
  job,
  stageFinal,
  accentHex,
  isDragging,
  overlay,
  revisionInteractive,
  assignees,
  dragHandle,
  onOpen,
}: {
  job: JobWithRelations;
  stageFinal: boolean;
  accentHex: string;
  isDragging?: boolean;
  overlay?: boolean;
  /** Quando falso (ex.: coluna só leitura com busca), não mostra o seletor de revisão. */
  revisionInteractive?: boolean;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  /** Alça de arrastar (Kanban). */
  dragHandle?: ReactNode;
  /** Abre o modal de detalhes (área do card, sem a alça). */
  onOpen?: () => void;
}) {
  const rev = job.client_revision ?? 0;
  const openEnabled = Boolean(onOpen && !overlay);
  const cardShadow = `inset 3px 0 0 0 ${accentHex}, 0 1px 2px rgb(12 10 9 / 0.05)`;

  const main = (
    <>
      <p className="text-sm font-semibold leading-snug text-ds-ink">{job.name}</p>
      {job.job_work_types?.name ? (
        <p className="mt-0.5 text-[11px] text-ds-muted">{job.job_work_types.name}</p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge kind="job-type" value={job.type} className="text-[10px] font-medium" />
        {overlay || !revisionInteractive ? (
          <span className="inline-flex items-center rounded-full border border-ds-border/60 bg-stone-50 px-1.5 py-px text-[10px] font-medium text-ds-muted">
            Alt. {rev}
          </span>
        ) : null}
      </div>
      {assignees.length ? (
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-ds-subtle">
            Equipe
          </span>
          <AvatarStack people={assignees} />
        </div>
      ) : null}
      {revisionInteractive && !overlay ? <ClientRevisionSelect job={job} /> : null}
      {job.contacts?.name ? (
        <p className="mt-1.5 text-[11px] text-ds-muted">{job.contacts.name}</p>
      ) : null}
      <p className="mt-1 text-[10px] leading-tight text-ds-subtle">
        Int. {formatDeadlinePt(job.internal_deadline.slice(0, 10))} · Final{" "}
        {formatDeadlinePt(job.deadline.slice(0, 10))}
      </p>
      <DeadlineTimelineBar job={job} stageFinal={stageFinal} />
    </>
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-ds-border/70 bg-white p-2 shadow-sm",
        isDragging && "opacity-60",
        overlay && "shadow-md ring-2 ring-ds-accent/15",
        openEnabled && !dragHandle && "cursor-pointer"
      )}
      style={{ boxShadow: cardShadow }}
      onClick={openEnabled && !dragHandle ? onOpen : undefined}
    >
      {dragHandle ? (
        <div className="flex gap-2">
          <div className="shrink-0 pt-0.5">{dragHandle}</div>
          <div
            className={cn("min-w-0 flex-1", openEnabled && "cursor-pointer")}
            onClick={openEnabled ? onOpen : undefined}
          >
            {main}
          </div>
        </div>
      ) : (
        main
      )}
    </div>
  );
});

const SortableJobCard = memo(function SortableJobCard({
  job,
  stageFinal,
  accentHex,
  dragDisabled,
  revisionInteractive,
  assignees,
  onOpenJob,
}: {
  job: JobWithRelations;
  stageFinal: boolean;
  accentHex: string;
  dragDisabled: boolean;
  revisionInteractive: boolean;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  onOpenJob: (j: JobWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = dragDisabled ? undefined : (
    <button
      type="button"
      className="flex h-7 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-ds-muted hover:border-ds-border/80 hover:bg-stone-50 hover:text-ds-ink"
      aria-label="Arrastar card"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3.5 w-3.5" aria-hidden />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <JobCardContent
        job={job}
        stageFinal={stageFinal}
        accentHex={accentHex}
        isDragging={isDragging}
        revisionInteractive={revisionInteractive}
        assignees={assignees}
        dragHandle={dragHandle}
        onOpen={() => onOpenJob(job)}
      />
    </div>
  );
});

const KanbanColumn = memo(function KanbanColumn({
  stage,
  jobIds,
  jobsById,
  dragDisabled,
  searchQuery,
  assigneesByJobId,
  onOpenJob,
}: {
  stage: StageRow;
  jobIds: string[];
  jobsById: Map<string, JobWithRelations>;
  dragDisabled: boolean;
  searchQuery: string;
  assigneesByJobId: Map<string, { id: string; name: string; avatarUrl: string | null }[]>;
  onOpenJob: (j: JobWithRelations) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    disabled: dragDisabled,
  });

  const visibleIds = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return jobIds;
    return jobIds.filter((id) => jobMatchesQuery(jobsById.get(id), q));
  }, [jobIds, jobsById, searchQuery]);

  const accentHex = kanbanStageAccentHex(stage.color);

  const columnTint = `color-mix(in srgb, ${accentHex} 13%, rgb(250 249 247))`;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-ds-border/60 shadow-sm transition-[box-shadow,colors]",
        /* Mobile/tablet: colunas com largura legível + scroll horizontal (evita flex-1 espremendo tudo). */
        "max-lg:w-[min(92vw,20rem)] max-lg:max-w-[20rem] max-lg:shrink-0 max-lg:flex-none",
        "lg:min-w-[128px] lg:max-w-[260px] lg:flex-1 lg:basis-0"
      )}
      style={{
        backgroundColor: columnTint,
        ...(isOver
          ? {
              boxShadow: `0 0 0 2px rgb(250 249 247), 0 0 0 5px ${accentHex}55`,
            }
          : {}),
      }}
    >
      <div
        className="shrink-0 border-b border-ds-border/35 px-2.5 py-2"
        style={{
          backgroundColor: `color-mix(in srgb, ${accentHex} 22%, white)`,
        }}
      >
        <h2 className="break-words text-[11px] font-semibold uppercase tracking-wide text-ds-muted">
          {stage.name}
        </h2>
      </div>
      {dragDisabled ? (
        <div
          className={cn(
            "flex flex-col gap-2 px-2 pb-2 pt-1.5",
            visibleIds.length === 0 && "min-h-[72px]"
          )}
        >
          {visibleIds.map((id) => {
            const job = jobsById.get(id);
            if (!job) return null;
            return (
              <JobCardContent
                key={id}
                job={job}
                stageFinal={stage.is_final}
                accentHex={accentHex}
                revisionInteractive
                assignees={assigneesByJobId.get(id) ?? []}
                onOpen={() => onOpenJob(job)}
              />
            );
          })}
        </div>
      ) : (
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={cn("flex flex-col gap-2 px-2 pb-2 pt-1.5", jobIds.length === 0 && "min-h-[72px]")}
          >
            {jobIds.map((id) => {
              const job = jobsById.get(id);
              if (!job) return null;
              return (
                <SortableJobCard
                  key={id}
                  job={job}
                  stageFinal={stage.is_final}
                  accentHex={accentHex}
                  dragDisabled={false}
                  revisionInteractive
                  assignees={assigneesByJobId.get(id) ?? []}
                  onOpenJob={onOpenJob}
                />
              );
            })}
          </div>
        </SortableContext>
      )}
    </div>
  );
});

export function BoardView({
  jobs,
  stages,
  contacts,
  workTypes,
  plan,
  members,
  manualAssignees,
  senderName,
  replyToEmail,
  accountSubjectTemplate,
  accountBodyTemplate,
}: BoardViewProps) {
  const router = useRouter();

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages]
  );
  const stageIdsOrdered = useMemo(() => sortedStages.map((s) => s.id), [sortedStages]);

  const [boardMonthYm, setBoardMonthYm] = useState(currentYearMonth);

  const filteredJobs = useMemo(
    () => jobs.filter((j) => jobVisibleInBoardMonth(j, boardMonthYm)),
    [jobs, boardMonthYm]
  );

  const jobsById = useMemo(() => {
    const m = new Map<string, JobWithRelations>();
    for (const j of filteredJobs) m.set(j.id, j);
    return m;
  }, [filteredJobs]);

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const singleMemberId = members.length === 1 ? members[0]!.id : null;
  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: m.name })),
    [members]
  );

  const manualAssigneeOptions = useMemo(
    () => manualAssignees.map((m) => ({ value: m.id, label: m.name })),
    [manualAssignees]
  );

  const manualById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl: string | null }>();
    for (const a of manualAssignees) {
      map.set(a.id, { id: a.id, name: a.name, avatarUrl: a.photo_url ?? null });
    }
    return map;
  }, [manualAssignees]);

  const useManualAssigneeDirectory = plan === "pro" && members.length === 1;

  const assigneesByJobId = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl: string | null }[]>();
    for (const j of filteredJobs) {
      map.set(j.id, assigneesForJobCard(j, membersById, singleMemberId, manualById));
    }
    return map;
  }, [filteredJobs, membersById, singleMemberId, manualById]);

  const [columnItems, setColumnItems] = useState<Record<string, string[]>>({});
  const columnItemsRef = useRef(columnItems);
  columnItemsRef.current = columnItems;

  const jobIdToStageId = useMemo(() => {
    const m = new Map<string, string>();
    for (const [sid, ids] of Object.entries(columnItems)) {
      for (const id of ids) m.set(id, sid);
    }
    return m;
  }, [columnItems]);

  useEffect(() => {
    setColumnItems(buildColumnItemsFromJobs(filteredJobs, stageIdsOrdered));
  }, [filteredJobs, stageIdsOrdered]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dragDisabled = searchQuery.trim().length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<JobWithRelations | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailStub, setEmailStub] = useState<JobWithRelations | null>(null);

  const stageOptions = useMemo(
    () =>
      sortedStages.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [sortedStages]
  );

  const workTypeOptions = useMemo(
    () =>
      [...workTypes]
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
        .map((w) => ({ value: w.id, label: w.name })),
    [workTypes]
  );

  const activeJob = activeId ? jobsById.get(activeId) ?? null : null;
  const activeStage = useMemo(() => {
    if (!activeId) return null;
    const sid = jobIdToStageId.get(activeId);
    return sid ? sortedStages.find((s) => s.id === sid) ?? null : null;
  }, [activeId, jobIdToStageId, sortedStages]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || dragDisabled) return;

      const prev = columnItemsRef.current;
      const next = applyDragEnd(prev, event, stageIdsOrdered);
      if (!next) return;

      const movedId = String(active.id);
      const jobBefore = jobsById.get(movedId);
      const stageBefore = jobBefore?.stage_id ?? undefined;
      const stageAfter = (() => {
        for (const [sid, ids] of Object.entries(next)) {
          if (ids.includes(movedId)) return sid;
        }
        return undefined;
      })();

      const snapshot = cloneColumnIds(prev);
      setColumnItems(next);

      let res: Awaited<ReturnType<typeof syncKanbanState>>;
      try {
        res = await syncKanbanState(toKanbanMoves(next, stageIdsOrdered));
      } catch {
        setColumnItems(snapshot);
        setErrorMessage("Falha ao comunicar com o servidor. Tente novamente.");
        return;
      }

      if (!res || res.ok !== true) {
        setColumnItems(snapshot);
        setErrorMessage(res && "error" in res ? res.error : "Não foi possível salvar o quadro.");
        return;
      }

      router.refresh();

      const targetStage = stageAfter
        ? sortedStages.find((s) => s.id === stageAfter)
        : undefined;
      if (
        targetStage?.is_final &&
        jobBefore &&
        stageBefore !== stageAfter &&
        stageAfter
      ) {
        setEmailStub(jobBefore);
      } else {
        toast.success("Quadro atualizado.", { duration: 2800 });
      }
    },
    [
      dragDisabled,
      jobsById,
      router,
      sortedStages,
      stageIdsOrdered,
    ]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const noStages = sortedStages.length === 0;

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
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <h1 className="text-xl font-bold tracking-tight text-ds-ink">Edições</h1>
          <div className="flex flex-col gap-1">
            <label htmlFor="board-month-filter" className="text-xs font-medium text-ds-muted">
              Mês do quadro
            </label>
            <input
              id="board-month-filter"
              type="month"
              value={boardMonthYm}
              onChange={(e) => setBoardMonthYm(e.target.value)}
              title="Mostra jobs com prazo interno ou final no mês; em Entregue, também os atualizados nesse mês."
              className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink shadow-sm focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative max-w-md flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar job ou contato…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
              aria-label="Buscar no quadro"
            />
          </div>
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

      {dragDisabled ? (
        <p className="text-xs text-ds-muted" role="status">
          Com busca ativa, o arraste está desligado para não desalinhar a ordem com o servidor.
        </p>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {noStages ? (
        <p className="text-sm text-amber-800" role="status">
          Não há etapas no kanban. Configure em Configurações quando disponível.
        </p>
      ) : null}

      {jobs.length === 0 && !noStages ? (
        <p className="text-sm text-ds-muted">
          Nenhum job no quadro ainda. Use &quot;Novo job&quot; para cadastrar.
        </p>
      ) : null}

      {jobs.length > 0 && filteredJobs.length === 0 && !noStages ? (
        <p className="text-sm text-ds-muted" role="status">
          Nenhuma edição neste mês: prazos interno/final fora de <strong>{boardMonthYm}</strong> e
          nenhuma entrega (etapa final) atualizada nesse período. Ajuste o mês acima.
        </p>
      ) : null}

      {sortedStages.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            className="w-full min-w-0 overflow-x-auto pb-4 pt-1 [scrollbar-width:thin] overscroll-x-contain touch-pan-x"
            role="region"
            aria-label="Colunas do quadro — em telas pequenas, deslize horizontalmente para ver todas as etapas"
          >
            <div
              id="kanban-board"
              className="flex w-max min-w-full flex-nowrap gap-3"
            >
              {sortedStages.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  jobIds={columnItems[stage.id] ?? []}
                  jobsById={jobsById}
                  dragDisabled={dragDisabled}
                  searchQuery={searchQuery}
                  assigneesByJobId={assigneesByJobId}
                  onOpenJob={setDetailJob}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeJob && activeStage ? (
              <JobCardContent
                job={activeJob}
                stageFinal={activeStage.is_final}
                accentHex={kanbanStageAccentHex(activeStage.color)}
                overlay
                assignees={assigneesByJobId.get(activeJob.id) ?? []}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <JobDetailModal
        job={detailJob}
        allJobs={jobs}
        members={members}
        manualAssignees={manualAssignees}
        open={Boolean(detailJob)}
        onClose={() => setDetailJob(null)}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo job" size="lg">
        <NewJobForm
          fieldIdPrefix="board-job-create"
          contacts={contacts}
          stageOptions={stageOptions}
          workTypeOptions={workTypeOptions}
          memberOptions={memberOptions}
          manualAssigneeOptions={manualAssigneeOptions}
          useManualAssigneeDirectory={useManualAssigneeDirectory}
          isPending={isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      <DeliveryEmailModal
        open={Boolean(emailStub)}
        onClose={() => setEmailStub(null)}
        onSuccess={() => {
          toast.success("E-mail enviado ao cliente.");
        }}
        jobName={emailStub?.name ?? ""}
        contactName={emailStub?.contacts?.name ?? null}
        contactEmail={emailStub?.contacts?.email ?? null}
        deliveryLink={emailStub?.delivery_link ?? null}
        plan={plan}
        senderName={senderName}
        replyToEmail={replyToEmail}
        accountSubjectTemplate={accountSubjectTemplate}
        accountBodyTemplate={accountBodyTemplate}
      />
    </div>
  );
}
