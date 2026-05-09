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
import {
  ChevronDown,
  ChevronRight,
  KanbanSquare,
  List,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Trash2,
  UserPlus,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  createTask,
  deleteTask,
  syncTasksKanban,
  updateTask,
  updateTaskStatus,
  updateTaskSubtasks,
  addTaskAssignee,
  removeTaskAssignee,
  getTaskDetails,
  getAvailableAssignees,
  addTaskComment,
  type TaskKanbanSync,
  type AvailablePerson,
} from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type {
  Database,
  TaskPriority,
  TaskStatus,
  TaskType,
  TaskSubtask,
} from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAssigneeRow = Database["public"]["Tables"]["task_assignees"]["Row"];
type TaskCommentRow = Database["public"]["Tables"]["task_comments"]["Row"];
type TaskWithAssignees = TaskRow & { task_assignees: TaskAssigneeRow[] };

type PanelState =
  | { mode: "closed" }
  | { mode: "create"; defaultStatus: TaskStatus }
  | { mode: "view"; taskId: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_COLUMNS: {
  id: TaskStatus;
  label: string;
  color: string;
  bg: string;
  pillCls: string;
  bgCls: string;
  iconCls: string;
}[] = [
  {
    id: "para_fazer",
    label: "Para fazer",
    color: "#f97316",
    bg: "#fff7ed",
    pillCls: "bg-orange-100 text-orange-800 border border-orange-200",
    bgCls: "bg-orange-50/60",
    iconCls: "text-orange-600/70",
  },
  {
    id: "iniciado",
    label: "Em progresso",
    color: "#f59e0b",
    bg: "#fffbeb",
    pillCls: "bg-amber-100 text-amber-800 border border-amber-200",
    bgCls: "bg-amber-50/60",
    iconCls: "text-amber-600/70",
  },
  {
    id: "feito",
    label: "Feito",
    color: "#10b981",
    bg: "#f0fdf4",
    pillCls: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    bgCls: "bg-emerald-50/60",
    iconCls: "text-emerald-600/70",
  },
];

const COLUMN_IDS = TASK_COLUMNS.map((c) => c.id);

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: "Menor",
  media: "Normal",
  alta:  "Urgente",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  baixa: "bg-emerald-50 text-emerald-700 border-emerald-200",
  media: "bg-orange-50 text-orange-700 border-orange-200",
  alta:  "bg-red-50 text-red-700 border-red-200",
};

const TYPE_LABELS: Record<TaskType, string> = {
  tarefa:  "Tarefa",
  sessao:  "Sessão",
  edicao:  "Edição",
  revisao: "Revisão",
  entrega: "Entrega",
};

const TYPE_CLASSES: Record<TaskType, string> = {
  tarefa:  "bg-violet-50 text-violet-700 border-violet-200",
  sessao:  "bg-sky-50 text-sky-700 border-sky-200",
  edicao:  "bg-amber-50 text-amber-700 border-amber-200",
  revisao: "bg-orange-50 text-orange-700 border-orange-200",
  entrega: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDatePt(ymd: string | null | undefined): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatDateShort(ymd: string | null | undefined): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d} ${months[parseInt(m, 10) - 1]}`;
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]![0] ?? "?").toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase();
}

const AVATAR_COLORS = [
  "#f97316","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#ec4899","#6366f1",
];
function avatarColor(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

// ─── Small UI components ─────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-px text-[10px] font-semibold", PRIORITY_CLASSES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function TypeBadge({ type }: { type: TaskType }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-px text-[10px] font-semibold", TYPE_CLASSES[type])}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function AvatarCircle({
  name,
  email,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-xs";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-white", sz)}
      />
    );
  }
  return (
    <div
      className={cn("rounded-full ring-2 ring-white flex items-center justify-center font-bold text-white", sz)}
      style={{ backgroundColor: avatarColor(email) }}
      title={name}
    >
      {nameInitials(name)}
    </div>
  );
}

function AvatarStack({ assignees, max = 3 }: { assignees: TaskAssigneeRow[]; max?: number }) {
  const shown = assignees.slice(0, max);
  const extra = assignees.length - max;
  if (assignees.length === 0) return <span className="text-ds-subtle text-[11px]">—</span>;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div key={a.id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}>
          <AvatarCircle name={a.name} email={a.email} avatarUrl={a.avatar_url} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="h-6 w-6 rounded-full ring-2 ring-white bg-ds-elevated flex items-center justify-center text-[9px] font-bold text-ds-muted"
          style={{ marginLeft: -6 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetailPanel({
  panel,
  tasks,
  onClose,
  onTaskSaved,
}: {
  panel: PanelState;
  tasks: TaskWithAssignees[];
  onClose: () => void;
  onTaskSaved: (taskId?: string) => void;
}) {
  const router = useRouter();
  const isCreate = panel.mode === "create";
  const task = panel.mode === "view" ? tasks.find((t) => t.id === panel.taskId) ?? null : null;

  const [assignees, setAssignees] = useState<TaskAssigneeRow[]>([]);
  const [comments, setComments] = useState<TaskCommentRow[]>([]);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  const [availablePeople, setAvailablePeople] = useState<AvailablePerson[]>([]);
  const [personSearch, setPersonSearch] = useState("");
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const [addingAssignee, setAddingAssignee] = useState(false);

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [status, setStatus] = useState<TaskStatus>("para_fazer");
  const [type, setType] = useState<TaskType>("tarefa");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [notes, setNotes] = useState("");

  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [subtaskInputOpen, setSubtaskInputOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panel.mode === "view" && task) {
      setName(task.name);
      setPriority(task.priority);
      setStatus(task.status);
      setType(task.type ?? "tarefa");
      setStartDate(task.start_date ?? "");
      setDeadline(task.deadline ?? "");
      setSubtasks((task.subtasks as TaskSubtask[]) ?? []);
      setNotes(task.notes ?? "");
      setConfirmDelete(false);
      setError(null);
    } else if (panel.mode === "create") {
      setName("");
      setPriority("media");
      setStatus(panel.defaultStatus);
      setType("tarefa");
      setStartDate("");
      setDeadline("");
      setSubtasks([]);
      setNotes("");
      setError(null);
    }
    setAssignees([]);
    setComments([]);
    setDetailsLoaded(false);
    setPersonDropdownOpen(false);
    setPersonSearch("");
  }, [panel.mode === "view" ? (panel as { mode: "view"; taskId: string }).taskId : "__create__"]);

  // Load system people when panel opens
  useEffect(() => {
    if (panel.mode !== "closed" && availablePeople.length === 0) {
      getAvailableAssignees().then((res) => {
        if (res.ok) setAvailablePeople(res.people);
      });
    }
  }, [panel.mode]);

  useEffect(() => {
    if (panel.mode === "view" && task && !detailsLoaded) {
      getTaskDetails(task.id).then((res) => {
        if (res.ok) {
          setAssignees(res.assignees);
          setComments(res.comments);
        }
        setDetailsLoaded(true);
      });
    }
  }, [panel.mode, detailsLoaded, task?.id]);

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!deadline) { setError("Prazo é obrigatório."); return; }
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("priority", priority);
      fd.set("status", status);
      fd.set("type", type);
      fd.set("start_date", startDate);
      fd.set("deadline", deadline);
      fd.set("notes", notes);

      if (isCreate) {
        const res = await createTask(fd);
        if (!res.ok) { setError(res.error); return; }
        toast.success("Tarefa criada.");
        onTaskSaved(res.taskId);
      } else if (task) {
        const res = await updateTask(task.id, fd);
        if (!res.ok) { setError(res.error); return; }
        toast.success("Tarefa atualizada.");
        onTaskSaved(task.id);
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    const res = await deleteTask(task.id);
    setDeleting(false);
    if (!res.ok) { toast.error(res.error); setConfirmDelete(false); return; }
    toast.success("Tarefa excluída.");
    onClose();
    router.refresh();
  }

  async function handleAddFromSystem(person: AvailablePerson) {
    if (!task) return;
    setAddingAssignee(true);
    const res = await addTaskAssignee(task.id, person.name, person.email, person.avatar_url);
    setAddingAssignee(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`${person.name} adicionado(a) e notificado(a) por e-mail.`);
    setPersonDropdownOpen(false);
    setPersonSearch("");
    const details = await getTaskDetails(task.id);
    if (details.ok) setAssignees(details.assignees);
  }

  async function handleRemoveAssignee(assigneeId: string) {
    if (!task) return;
    const res = await removeTaskAssignee(assigneeId, task.id);
    if (!res.ok) { toast.error(res.error); return; }
    setAssignees((prev) => prev.filter((a) => a.id !== assigneeId));
  }

  async function handleAddComment() {
    if (!task || !newComment.trim()) return;
    setAddingComment(true);
    const res = await addTaskComment(task.id, newComment);
    setAddingComment(false);
    if (!res.ok) { toast.error(res.error); return; }
    setNewComment("");
    const details = await getTaskDetails(task.id);
    if (details.ok) setComments(details.comments);
  }

  async function handleToggleSubtask(id: string) {
    if (!task) return;
    const next = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(next);
    await updateTaskSubtasks(task.id, next);
  }

  async function handleAddSubtask() {
    if (!task || !newSubtaskName.trim()) return;
    const next: TaskSubtask[] = [
      ...subtasks,
      { id: crypto.randomUUID(), name: newSubtaskName.trim(), done: false },
    ];
    setSubtasks(next);
    setNewSubtaskName("");
    setSubtaskInputOpen(false);
    await updateTaskSubtasks(task.id, next);
  }

  async function handleRemoveSubtask(id: string) {
    if (!task) return;
    const next = subtasks.filter((s) => s.id !== id);
    setSubtasks(next);
    await updateTaskSubtasks(task.id, next);
  }

  const isOpen = panel.mode !== "closed";
  const inputCls =
    "w-full rounded-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink placeholder:text-ds-subtle focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";
  const selectCls =
    "w-full rounded-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ds-ink/10 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl",
          "w-full sm:w-[480px]",
          "border-l border-ds-border",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Panel Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ds-border px-5 py-3">
          <div className="flex items-center gap-3 text-xs text-ds-subtle">
            {task ? (
              <span>Criado em {formatDatePt(task.created_at.slice(0, 10))}</span>
            ) : (
              <span className="font-semibold text-ds-ink">Nova tarefa</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {task && !isCreate && (
              <div className="flex items-center gap-1 mr-2">
                <PriorityBadge priority={priority} />
                <TypeBadge type={type} />
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ds-subtle hover:bg-ds-cream hover:text-ds-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 [scrollbar-width:thin]">
          {/* Task Name */}
          <textarea
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da tarefa…"
            rows={2}
            className="mb-5 w-full resize-none border-0 bg-transparent text-xl font-bold text-ds-ink placeholder:text-ds-subtle focus:outline-none"
          />

          {/* Fields grid */}
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-ds-border bg-ds-cream/40 p-4">
            {/* People */}
            <div className="flex items-start gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-ds-muted pt-1">Pessoas</span>
              <div className="min-w-0 flex-1">
                {assignees.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {assignees.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 rounded-full border border-ds-border bg-white px-2 py-1"
                      >
                        <AvatarCircle name={a.name} email={a.email} avatarUrl={a.avatar_url} />
                        <span className="max-w-[100px] truncate text-xs text-ds-ink">{a.name}</span>
                        {task && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(a.id)}
                            className="ml-0.5 text-ds-subtle hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {task && (
                  <>
                    {personDropdownOpen ? (
                      <div className="flex flex-col gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={personSearch}
                          onChange={(e) => setPersonSearch(e.target.value)}
                          placeholder="Buscar por nome ou e-mail…"
                          className={inputCls}
                          onKeyDown={(e) => { if (e.key === "Escape") setPersonDropdownOpen(false); }}
                        />
                        <div className="max-h-44 overflow-y-auto rounded-lg border border-ds-border bg-white [scrollbar-width:thin]">
                          {(() => {
                            const filtered = availablePeople.filter(
                              (p) =>
                                !assignees.some((a) => a.email.toLowerCase() === p.email.toLowerCase()) &&
                                (personSearch === "" ||
                                  p.name.toLowerCase().includes(personSearch.toLowerCase()) ||
                                  p.email.toLowerCase().includes(personSearch.toLowerCase()))
                            );
                            if (filtered.length === 0) {
                              return (
                                <p className="px-3 py-4 text-center text-xs text-ds-subtle">
                                  {availablePeople.length === 0
                                    ? "Nenhum membro ou responsável cadastrado."
                                    : "Nenhuma pessoa encontrada."}
                                </p>
                              );
                            }
                            return filtered.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                disabled={addingAssignee}
                                onClick={() => handleAddFromSystem(p)}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-ds-cream/80 disabled:opacity-60 border-b border-ds-border/40 last:border-0"
                              >
                                <AvatarCircle name={p.name} email={p.email} avatarUrl={p.avatar_url} size="md" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-ds-ink">{p.name}</p>
                                  <p className="truncate text-[11px] text-ds-subtle">{p.email}</p>
                                </div>
                              </button>
                            ));
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPersonDropdownOpen(false); setPersonSearch(""); }}
                          className="self-start text-xs text-ds-subtle hover:text-ds-ink"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPersonDropdownOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-ds-subtle hover:text-ds-accent"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Adicionar pessoa da equipe
                      </button>
                    )}
                  </>
                )}

                {isCreate && (
                  <span className="text-xs text-ds-subtle">Salve a tarefa para adicionar pessoas.</span>
                )}
              </div>
            </div>

            {/* Timeline — two rows to prevent overflow */}
            <div className="flex items-start gap-3">
              <span className="w-24 shrink-0 pt-2 text-xs font-medium text-ds-muted">Período</span>
              <div className="min-w-0 flex-1 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-ds-subtle">Início</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-ds-subtle">Prazo <span className="text-red-400">*</span></span>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-ds-muted">Tipo</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className={cn(selectCls, "flex-1")}
              >
                <option value="tarefa">Tarefa</option>
                <option value="sessao">Sessão</option>
                <option value="edicao">Edição</option>
                <option value="revisao">Revisão</option>
                <option value="entrega">Entrega</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-ds-muted">Prioridade</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={cn(selectCls, "flex-1")}
              >
                <option value="baixa">Menor</option>
                <option value="media">Normal</option>
                <option value="alta">Urgente</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-ds-muted">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={cn(selectCls, "flex-1")}
              >
                <option value="para_fazer">Para fazer</option>
                <option value="iniciado">Em progresso</option>
                <option value="feito">Feito</option>
              </select>
            </div>

            {/* Notes */}
            <div className="flex items-start gap-3">
              <span className="w-24 shrink-0 pt-1 text-xs font-medium text-ds-muted">Observações</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações internas…"
                rows={2}
                className={cn(inputCls, "flex-1 resize-none")}
              />
            </div>
          </div>

          {/* Subtasks */}
          {!isCreate && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ds-muted">
                  Subtarefas {subtasks.length > 0 && `(${subtasks.filter(s => s.done).length}/${subtasks.length})`}
                </h3>
                <button
                  type="button"
                  onClick={() => setSubtaskInputOpen(true)}
                  className="flex items-center gap-1 text-xs text-ds-subtle hover:text-ds-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-2 rounded-lg border border-ds-border bg-ds-cream/50 px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(s.id)}
                      className="shrink-0 text-ds-muted hover:text-ds-accent"
                    >
                      {s.done ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span className={cn("flex-1 text-sm text-ds-ink", s.done && "line-through text-ds-subtle")}>
                      {s.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(s.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-ds-subtle hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {subtaskInputOpen && (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      autoFocus
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      placeholder="Nome da subtarefa…"
                      className={inputCls}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") setSubtaskInputOpen(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="shrink-0 rounded-lg bg-ds-accent px-3 text-xs font-semibold text-white hover:bg-ds-accent/90"
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {!isCreate && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-muted">
                Comentários ({comments.length})
              </h3>
              <div className="mb-3 flex flex-col gap-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div
                      className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: avatarColor(c.user_id) }}
                    >
                      {nameInitials(c.user_name)}
                    </div>
                    <div className="flex-1 rounded-xl border border-ds-border bg-ds-cream/60 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ds-ink">{c.user_name}</span>
                        <span className="text-[10px] text-ds-subtle">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-ds-muted leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário…"
                  rows={2}
                  className={cn(inputCls, "flex-1 resize-none")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="self-end rounded-lg bg-ds-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ds-ink/90 disabled:opacity-40"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        {/* Panel Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-ds-border px-5 py-3">
          {/* Delete */}
          {task && !isCreate ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Excluindo…" : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-ds-border px-3 py-1.5 text-xs font-medium text-ds-muted hover:bg-ds-cream"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            )
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Fechar
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : isCreate ? "Criar tarefa" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function StatusGroupHeader({
  col,
  count,
  open,
  onToggle,
  onAdd,
}: {
  col: (typeof TASK_COLUMNS)[number];
  count: number;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn("flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none", col.bgCls)}
      onClick={onToggle}
    >
      {open ? (
        <ChevronDown className={cn("h-4 w-4 shrink-0", col.iconCls)} />
      ) : (
        <ChevronRight className={cn("h-4 w-4 shrink-0", col.iconCls)} />
      )}
      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", col.pillCls)}>
        {col.label}
      </span>
      <span className="text-xs font-medium text-ds-muted">{count}</span>
      <div className="ml-auto">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ds-subtle hover:bg-white/70 hover:text-ds-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </button>
      </div>
    </div>
  );
}

const TaskListRow = memo(function TaskListRow({
  task,
  onOpen,
  onToggleDone,
}: {
  task: TaskWithAssignees;
  onOpen: () => void;
  onToggleDone: () => void;
}) {
  const isDone = task.status === "feito";

  return (
    <tr
      className="group border-b border-ds-border/40 hover:bg-ds-cream/40 cursor-pointer transition-colors"
      onClick={onOpen}
    >
      {/* Checkbox */}
      <td className="w-10 px-3 py-3" onClick={(e) => { e.stopPropagation(); onToggleDone(); }}>
        <button
          type="button"
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
            isDone
              ? "border-emerald-400 bg-emerald-400 text-white"
              : "border-ds-border bg-white hover:border-ds-accent"
          )}
          aria-label={isDone ? "Marcar como não feito" : "Marcar como feito"}
        >
          {isDone && (
            <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </td>
      {/* Name + description */}
      <td className="px-3 py-3 min-w-[180px]">
        <p className={cn("text-sm font-semibold text-ds-ink leading-snug", isDone && "line-through text-ds-subtle")}>
          {task.name}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-ds-muted">{task.description}</p>
        )}
      </td>
      {/* People */}
      <td className="px-3 py-3">
        <AvatarStack assignees={task.task_assignees} />
      </td>
      {/* Type */}
      <td className="px-3 py-3">
        <TypeBadge type={task.type ?? "tarefa"} />
      </td>
      {/* Timeline */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-xs text-ds-muted">
          {task.start_date ? `${formatDateShort(task.start_date)} → ` : ""}
          {formatDateShort(task.deadline)}
        </span>
      </td>
      {/* Priority */}
      <td className="px-3 py-3">
        <PriorityBadge priority={task.priority} />
      </td>
      {/* More */}
      <td className="w-10 px-3 py-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="rounded-lg p-1 text-ds-subtle opacity-0 group-hover:opacity-100 hover:bg-ds-cream hover:text-ds-ink transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
});

function ListView({
  tasks,
  onOpenTask,
  onOpenCreate,
  onToggleDone,
}: {
  tasks: TaskWithAssignees[];
  onOpenTask: (taskId: string) => void;
  onOpenCreate: (status: TaskStatus) => void;
  onToggleDone: (task: TaskWithAssignees) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const tasksByStatus = TASK_COLUMNS.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }),
    {} as Record<TaskStatus, TaskWithAssignees[]>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-ds-muted">Nenhuma tarefa ainda.</p>
        <button
          type="button"
          onClick={() => onOpenCreate("para_fazer")}
          className="flex items-center gap-2 rounded-ds-xl bg-ds-accent px-4 py-2 text-sm font-semibold text-white hover:bg-ds-accent/90"
        >
          <Plus className="h-4 w-4" />
          Criar primeira tarefa
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
      {/* Table header */}
      <div className="hidden lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ds-border bg-ds-cream/80">
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Nome da tarefa</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Pessoas</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Tipo</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Período</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-ds-muted">Prioridade</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {TASK_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] ?? [];
              const isOpen = !collapsed[col.id];
              return (
                <>
                  {/* Status group header */}
                  <tr key={`header-${col.id}`}>
                    <td colSpan={7} className="p-0">
                      <StatusGroupHeader
                        col={col}
                        count={colTasks.length}
                        open={isOpen}
                        onToggle={() => toggle(col.id)}
                        onAdd={() => onOpenCreate(col.id)}
                      />
                    </td>
                  </tr>
                  {/* Tasks */}
                  {isOpen &&
                    colTasks.map((task) => (
                      <TaskListRow
                        key={task.id}
                        task={task}
                        onOpen={() => onOpenTask(task.id)}
                        onToggleDone={() => onToggleDone(task)}
                      />
                    ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col lg:hidden">
        {TASK_COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id] ?? [];
          const isOpen = !collapsed[col.id];
          return (
            <div key={col.id}>
              <StatusGroupHeader
                col={col}
                count={colTasks.length}
                open={isOpen}
                onToggle={() => toggle(col.id)}
                onAdd={() => onOpenCreate(col.id)}
              />
              {isOpen &&
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border-b border-ds-border/40 px-4 py-3 hover:bg-ds-cream/40 cursor-pointer"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            task.status === "feito"
                              ? "border-emerald-400 bg-emerald-400 text-white"
                              : "border-ds-border bg-white"
                          )}
                        >
                          {task.status === "feito" && (
                            <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold text-ds-ink", task.status === "feito" && "line-through text-ds-subtle")}>
                          {task.name}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-ds-muted">{task.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <TypeBadge type={task.type ?? "tarefa"} />
                          <PriorityBadge priority={task.priority} />
                          {task.deadline && (
                            <span className="text-[11px] text-ds-subtle">{formatDateShort(task.deadline)}</span>
                          )}
                          <AvatarStack assignees={task.task_assignees} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Kanban View (preserved) ──────────────────────────────────────────────────

function buildColumnItems(tasks: TaskWithAssignees[]): Record<TaskStatus, string[]> {
  const map: Record<TaskStatus, TaskWithAssignees[]> = { para_fazer: [], iniciado: [], feito: [] };
  for (const t of tasks) { if (COLUMN_IDS.includes(t.status)) map[t.status].push(t); }
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
  next[overCol] = dst;
  return next;
}

function toSyncMoves(cols: Record<TaskStatus, string[]>): TaskKanbanSync[] {
  return COLUMN_IDS.map((id) => ({ status: id, taskIdsOrdered: cols[id] ?? [] }));
}

const KanbanCard = memo(function KanbanCard({
  task,
  accentHex,
  isDragging,
  overlay,
  onEdit,
}: {
  task: TaskWithAssignees;
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
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <TypeBadge type={task.type ?? "tarefa"} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <AvatarStack assignees={task.task_assignees} max={3} />
        <span className="text-[10px] text-ds-subtle">{formatDateShort(task.deadline)}</span>
      </div>
    </div>
  );
});

const SortableKanbanCard = memo(function SortableKanbanCard({
  task,
  accentHex,
  onEdit,
}: {
  task: TaskWithAssignees;
  accentHex: string;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="touch-none" {...attributes} {...listeners}>
      <KanbanCard task={task} accentHex={accentHex} isDragging={isDragging} onEdit={onEdit} />
    </div>
  );
});

const KanbanColumn = memo(function KanbanColumn({
  col,
  taskIds,
  tasksById,
  onEditTask,
  onAddTask,
}: {
  col: (typeof TASK_COLUMNS)[number];
  taskIds: string[];
  tasksById: Map<string, TaskWithAssignees>;
  onEditTask: (t: TaskWithAssignees) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${col.id}` });
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-ds-border/60 shadow-sm transition-[box-shadow,colors]",
        col.bgCls,
        "max-lg:w-[min(92vw,20rem)] max-lg:max-w-[20rem] max-lg:shrink-0 max-lg:flex-none",
        "lg:min-w-[128px] lg:max-w-[280px] lg:flex-1 lg:basis-0"
      )}
      style={{
        ...(isOver ? { boxShadow: `0 0 0 2px rgb(255 255 255 / 0.6), 0 0 0 5px ${col.color}55` } : {}),
      }}
    >
      <div className="shrink-0 border-b border-ds-border/35 bg-white/35 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", col.pillCls)}>
            {col.label}
          </span>
          <span className="text-[10px] font-medium text-ds-subtle">{taskIds.length}</span>
        </div>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={cn("flex flex-col gap-2 px-2 pb-2 pt-1.5", taskIds.length === 0 && "min-h-[72px]")}>
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            if (!task) return null;
            return <SortableKanbanCard key={id} task={task} accentHex={col.color} onEdit={() => onEditTask(task)} />;
          })}
        </div>
      </SortableContext>
      <div className="shrink-0 px-2 pb-2">
        <button
          type="button"
          onClick={() => onAddTask(col.id)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-ds-subtle transition-colors hover:bg-white/60 hover:text-ds-muted"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar tarefa
        </button>
      </div>
    </div>
  );
});

// ─── Main TasksView ───────────────────────────────────────────────────────────

export function TasksView({ tasks }: { tasks: TaskWithAssignees[] }) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [panel, setPanel] = useState<PanelState>({ mode: "closed" });
  const [columnItems, setColumnItems] = useState<Record<TaskStatus, string[]>>(() =>
    buildColumnItems(tasks)
  );
  const columnItemsRef = useRef(columnItems);
  columnItemsRef.current = columnItems;

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => { setColumnItems(buildColumnItems(tasks)); }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((e: DragStartEvent) => { setActiveId(String(e.active.id)); }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const prev = columnItemsRef.current;
    const next = applyDrag(prev, event);
    if (!next) return;
    setColumnItems(next);
    const res = await syncTasksKanban(toSyncMoves(next));
    if (!res.ok) { setColumnItems(prev); toast.error(res.error); return; }
    router.refresh();
  }, [router]);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  async function handleToggleDone(task: TaskWithAssignees) {
    const nextStatus: TaskStatus = task.status === "feito" ? "para_fazer" : "feito";
    const res = await updateTaskStatus(task.id, nextStatus);
    if (!res.ok) { toast.error(res.error); return; }
    router.refresh();
  }

  const activeTask = activeId ? tasksById.get(activeId) ?? null : null;
  const activeCol = activeTask
    ? TASK_COLUMNS.find((c) => c.id === activeTask.status) ?? TASK_COLUMNS[0]!
    : TASK_COLUMNS[0]!;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ds-ink">Tarefas</h1>
          <p className="text-sm text-ds-muted">{tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl border border-ds-border bg-ds-cream p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "list" ? "bg-white text-ds-ink shadow-sm" : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "kanban" ? "bg-white text-ds-ink shadow-sm" : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>

          <Button
            type="button"
            size="md"
            onClick={() => setPanel({ mode: "create", defaultStatus: "para_fazer" })}
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* List View */}
      {view === "list" ? (
        <ListView
          tasks={tasks}
          onOpenTask={(taskId) => setPanel({ mode: "view", taskId })}
          onOpenCreate={(status) => setPanel({ mode: "create", defaultStatus: status })}
          onToggleDone={handleToggleDone}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            className="w-full min-w-0 overflow-x-auto px-2 pb-4 pt-1 [scrollbar-width:thin] overscroll-x-contain touch-pan-x"
            role="region"
            aria-label="Colunas do kanban"
          >
            <div className="flex w-max min-w-full flex-nowrap gap-3">
              {TASK_COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  taskIds={columnItems[col.id] ?? []}
                  tasksById={tasksById}
                  onEditTask={(t) => setPanel({ mode: "view", taskId: t.id })}
                  onAddTask={(status) => setPanel({ mode: "create", defaultStatus: status })}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <KanbanCard task={activeTask} accentHex={activeCol.color} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Detail Panel */}
      <TaskDetailPanel
        panel={panel}
        tasks={tasks}
        onClose={() => setPanel({ mode: "closed" })}
        onTaskSaved={(taskId) => {
          if (taskId) setPanel({ mode: "view", taskId });
          else setPanel({ mode: "closed" });
          router.refresh();
        }}
      />
    </div>
  );
}
