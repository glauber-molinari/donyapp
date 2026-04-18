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
import { KanbanSquare, List, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createTask, deleteTask, syncTasksKanban, updateTask, type TaskKanbanSync } from "./actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Database, TaskPriority, TaskStatus } from "@/types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

// ─── Colunas fixas ──────────────────────────────────────────────────────────

const TASK_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "para_fazer", label: "Para fazer", color: "#94a3b8" },
  { id: "iniciado",   label: "Iniciado",   color: "#f59e0b" },
  { id: "feito",      label: "Feito",      color: "#10b981" },
];

const COLUMN_IDS = TASK_COLUMNS.map((c) => c.id);

// ─── Prioridade helpers ──────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  baixa: "bg-emerald-50 text-emerald-700 border-emerald-200",
  media: "bg-amber-50  text-amber-700  border-amber-200",
  alta:  "bg-red-50    text-red-700    border-red-200",
};

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-px text-[10px] font-semibold",
        PRIORITY_CLASSES[priority]
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function formatDatePt(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  para_fazer: "Para fazer",
  iniciado:   "Iniciado",
  feito:      "Feito",
};

// ─── Kanban state helpers ────────────────────────────────────────────────────

function buildColumnItems(tasks: TaskRow[]): Record<TaskStatus, string[]> {
  const map: Record<TaskStatus, TaskRow[]> = {
    para_fazer: [],
    iniciado:   [],
    feito:      [],
  };
  for (const t of tasks) {
    if (COLUMN_IDS.includes(t.status)) map[t.status].push(t);
  }
  const out: Record<TaskStatus, string[]> = { para_fazer: [], iniciado: [], feito: [] };
  for (const sid of COLUMN_IDS) {
    map[sid].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    out[sid] = map[sid].map((t) => t.id);
  }
  return out;
}

function applyDrag(
  prev: Record<TaskStatus, string[]>,
  event: DragEndEvent
): Record<TaskStatus, string[]> | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;

  const activeId = String(active.id);
  const overId = String(over.id);

  const idToStatus = new Map<string, TaskStatus>();
  for (const [sid, ids] of Object.entries(prev) as [TaskStatus, string[]][]) {
    for (const id of ids) idToStatus.set(id, sid);
  }

  const activeCol = idToStatus.get(activeId);
  let overCol = idToStatus.get(overId);
  if (!overCol && overId.startsWith("col-")) overCol = overId.slice(4) as TaskStatus;
  if (!activeCol || !overCol) return null;

  const next = { ...prev } as Record<TaskStatus, string[]>;

  if (activeCol === overCol) {
    const items = prev[activeCol];
    const oldIdx = items.indexOf(activeId);
    const newIdx = items.indexOf(overId);
    if (oldIdx === -1 || newIdx === -1) return null;
    next[activeCol] = arrayMove(items, oldIdx, newIdx);
    return next;
  }

  const src = [...prev[activeCol]];
  const dst = [...prev[overCol]];
  src.splice(src.indexOf(activeId), 1);
  const overIdx = dst.indexOf(overId);
  dst.splice(overIdx >= 0 ? overIdx : dst.length, 0, activeId);
  next[activeCol] = src;
  next[overCol]   = dst;
  return next;
}

function toSyncMoves(cols: Record<TaskStatus, string[]>): TaskKanbanSync[] {
  return COLUMN_IDS.map((id) => ({ status: id, taskIdsOrdered: cols[id] ?? [] }));
}

// ─── Task form modal ─────────────────────────────────────────────────────────

function TaskFormModal({
  open,
  onClose,
  task,
  defaultStatus,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskRow | null;
  defaultStatus: TaskStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = task !== null;

  useEffect(() => {
    if (open) {
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, task?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const res = isEdit
        ? await updateTask(task.id, fd)
        : await createTask(fd);
      if (!res.ok) { setError(res.error); return; }
      toast.success(isEdit ? "Tarefa atualizada." : "Tarefa criada.");
      onClose();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar tarefa" : "Nova tarefa"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-name" className="text-xs font-medium text-ds-muted">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="task-name"
            name="name"
            type="text"
            required
            defaultValue={task?.name ?? ""}
            placeholder="Ex.: Editar álbum de casamento"
            className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
          />
        </div>

        {/* Prioridade + Prazo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="task-priority" className="text-xs font-medium text-ds-muted">
              Prioridade <span className="text-red-500">*</span>
            </label>
            <select
              id="task-priority"
              name="priority"
              required
              defaultValue={task?.priority ?? "media"}
              className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="task-deadline" className="text-xs font-medium text-ds-muted">
              Prazo <span className="text-red-500">*</span>
            </label>
            <input
              id="task-deadline"
              name="deadline"
              type="date"
              required
              defaultValue={task?.deadline ?? ""}
              className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
            />
          </div>
        </div>

        {/* Status (coluna) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-status" className="text-xs font-medium text-ds-muted">
            Coluna
          </label>
          <select
            id="task-status"
            name="status"
            defaultValue={task?.status ?? defaultStatus}
            className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
          >
            {TASK_COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-notes" className="text-xs font-medium text-ds-muted">
            Observações
          </label>
          <textarea
            id="task-notes"
            name="notes"
            rows={3}
            defaultValue={task?.notes ?? ""}
            placeholder="Detalhes opcionais…"
            className="rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2 text-sm text-ds-ink placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20 resize-none"
          />
        </div>

        {error ? (
          <p role="alert" className="text-xs text-red-600">{error}</p>
        ) : null}

        {/* Ações */}
        <div className="flex items-center justify-between gap-3 border-t border-app-border pt-3">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const res = await deleteTask(task.id);
                    setDeleting(false);
                    if (!res.ok) { toast.error(res.error); setConfirmDelete(false); return; }
                    toast.success("Tarefa excluída.");
                    onClose();
                    router.refresh();
                  }}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Excluindo…" : "Confirmar"}
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
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Excluir
              </button>
            )
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar tarefa"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Card do Kanban ──────────────────────────────────────────────────────────

const TaskCardContent = memo(function TaskCardContent({
  task,
  accentHex,
  isDragging,
  overlay,
  onEdit,
}: {
  task: TaskRow;
  accentHex: string;
  isDragging?: boolean;
  overlay?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ds-border/70 bg-white p-3 shadow-sm",
        isDragging && "opacity-60",
        overlay && "shadow-md ring-2 ring-ds-accent/15",
        onEdit && !overlay && "cursor-pointer"
      )}
      style={{ boxShadow: `inset 3px 0 0 0 ${accentHex}, 0 1px 2px rgb(12 10 9 / 0.05)` }}
      onClick={onEdit && !overlay ? onEdit : undefined}
    >
      <p className="text-sm font-semibold leading-snug text-ds-ink">{task.name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="text-[10px] text-ds-subtle">{formatDatePt(task.deadline)}</span>
      </div>
      {task.notes ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] text-ds-muted">{task.notes}</p>
      ) : null}
    </div>
  );
});

const SortableTaskCard = memo(function SortableTaskCard({
  task,
  accentHex,
  onEdit,
}: {
  task: TaskRow;
  accentHex: string;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <TaskCardContent task={task} accentHex={accentHex} isDragging={isDragging} onEdit={onEdit} />
    </div>
  );
});

// ─── Coluna Kanban ────────────────────────────────────────────────────────────

const KanbanColumn = memo(function KanbanColumn({
  col,
  taskIds,
  tasksById,
  onEditTask,
  onAddTask,
}: {
  col: (typeof TASK_COLUMNS)[number];
  taskIds: string[];
  tasksById: Map<string, TaskRow>;
  onEditTask: (t: TaskRow) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col.id}` });
  const columnTint = `color-mix(in srgb, ${col.color} 10%, rgb(250 249 247))`;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-ds-border/60 shadow-sm transition-[box-shadow,colors]",
        "max-lg:w-[min(92vw,20rem)] max-lg:max-w-[20rem] max-lg:shrink-0 max-lg:flex-none",
        "lg:min-w-[128px] lg:max-w-[280px] lg:flex-1 lg:basis-0"
      )}
      style={{
        backgroundColor: columnTint,
        ...(isOver ? { boxShadow: `0 0 0 2px rgb(250 249 247), 0 0 0 5px ${col.color}55` } : {}),
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 border-b border-ds-border/35 px-2.5 py-2"
        style={{ backgroundColor: `color-mix(in srgb, ${col.color} 18%, white)` }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ds-muted">
            {col.label}
          </h2>
          <span className="text-[10px] font-medium text-ds-subtle">{taskIds.length}</span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex flex-col gap-2 px-2 pb-2 pt-1.5", taskIds.length === 0 && "min-h-[72px]")}
        >
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            if (!task) return null;
            return (
              <SortableTaskCard
                key={id}
                task={task}
                accentHex={col.color}
                onEdit={() => onEditTask(task)}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Adicionar nesta coluna */}
      <div className="shrink-0 px-2 pb-2">
        <button
          type="button"
          onClick={() => onAddTask(col.id)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-ds-subtle transition-colors hover:bg-white/60 hover:text-ds-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Adicionar tarefa
        </button>
      </div>
    </div>
  );
});

// ─── Visualização em Lista ───────────────────────────────────────────────────

function ListView({
  tasks,
  onEditTask,
}: {
  tasks: TaskRow[];
  onEditTask: (t: TaskRow) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="mt-6 text-sm text-ds-muted">
        Nenhuma tarefa ainda. Use &quot;Nova tarefa&quot; para adicionar.
      </p>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-ds-border/60 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-app-border bg-ds-cream/90">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Nome</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Prioridade</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Prazo</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-app-border/60 last:border-0 hover:bg-ds-cream/40">
                <td className="px-4 py-3 font-medium text-ds-ink">
                  {t.name}
                  {t.notes ? (
                    <p className="mt-0.5 text-xs text-ds-muted line-clamp-1">{t.notes}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 text-xs text-ds-muted">{formatDatePt(t.deadline)}</td>
                <td className="px-4 py-3 text-xs text-ds-muted">{STATUS_LABELS[t.status]}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onEditTask(t)}
                    className="rounded-md border border-app-border p-1.5 text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
                    aria-label={`Editar ${t.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-3 lg:hidden">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-ds-border/60 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ds-ink">{t.name}</p>
                {t.notes ? (
                  <p className="mt-0.5 text-xs text-ds-muted line-clamp-2">{t.notes}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <span className="text-[11px] text-ds-subtle">{formatDatePt(t.deadline)}</span>
                  <span className="text-[11px] text-ds-subtle">{STATUS_LABELS[t.status]}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditTask(t)}
                className="shrink-0 rounded-md border border-app-border p-1.5 text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
                aria-label={`Editar ${t.name}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── View principal ──────────────────────────────────────────────────────────

export function TasksView({ tasks }: { tasks: TaskRow[] }) {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [columnItems, setColumnItems] = useState<Record<TaskStatus, string[]>>(() =>
    buildColumnItems(tasks)
  );
  const columnItemsRef = useRef(columnItems);
  columnItemsRef.current = columnItems;

  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("para_fazer");

  useEffect(() => {
    setColumnItems(buildColumnItems(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const prev = columnItemsRef.current;
    const next = applyDrag(prev, event);
    if (!next) return;

    setColumnItems(next);
    const res = await syncTasksKanban(toSyncMoves(next));
    if (!res.ok) {
      setColumnItems(prev);
      toast.error(res.error);
      return;
    }
    router.refresh();
  }, [router]);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  function openCreate(status: TaskStatus) {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }

  function openEdit(task: TaskRow) {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  }

  const activeTask = activeId ? tasksById.get(activeId) ?? null : null;
  const activeCol = activeTask
    ? TASK_COLUMNS.find((c) => c.id === activeTask.status) ?? TASK_COLUMNS[0]!
    : TASK_COLUMNS[0]!;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-ds-ink">Tarefas</h1>

        <div className="flex items-center gap-3">
          {/* Toggle de view */}
          <div className="flex rounded-ds-xl border border-app-border bg-app-sidebar p-0.5">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "kanban"
                  ? "bg-white text-ds-ink shadow-sm"
                  : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" aria-hidden />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-white text-ds-ink shadow-sm"
                  : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
              Lista
            </button>
          </div>

          <Button
            type="button"
            size="md"
            onClick={() => openCreate("para_fazer")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" ? (
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
            aria-label="Colunas do quadro — em telas pequenas, deslize horizontalmente"
          >
            <div className="flex w-max min-w-full flex-nowrap gap-3">
              {TASK_COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  taskIds={columnItems[col.id] ?? []}
                  tasksById={tasksById}
                  onEditTask={openEdit}
                  onAddTask={openCreate}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <TaskCardContent
                task={activeTask}
                accentHex={activeCol.color}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView tasks={tasks} onEditTask={openEdit} />
      )}

      {/* Modal criar/editar */}
      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
