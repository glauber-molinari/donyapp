"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  addKanbanStage,
  deleteKanbanStage,
  reorderKanbanStages,
  setFinalKanbanStage,
  updateKanbanStageName,
} from "./kanban-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Stage = Database["public"]["Tables"]["kanban_stages"]["Row"];
type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];

const FREE_MAX_STAGES = 4;

function SortableStageRow({
  stage,
  isAdmin,
  disabled,
  onEdit,
  onDelete,
  onSetFinal,
  isFinalBusy,
}: {
  stage: Stage;
  isAdmin: boolean;
  disabled: boolean;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
  onSetFinal: (stageId: string) => void;
  isFinalBusy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: disabled || !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2.5 shadow-ds-sm",
        isDragging && "z-10 opacity-90 ring-2 ring-ds-accent/25"
      )}
    >
      {isAdmin ? (
        <button
          type="button"
          className="touch-none text-ds-subtle hover:text-ds-ink"
          aria-label="Arrastar etapa"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 shrink-0" />
        </button>
      ) : (
        <span className="w-5 shrink-0" aria-hidden />
      )}

      <div
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg border border-ds-border/80",
          stage.color
        )}
        title="Cor da coluna no quadro"
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ds-ink">{stage.name}</p>
        <p className="text-xs text-ds-subtle">Posição {stage.position}</p>
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-ds-muted">
        <input
          type="radio"
          name="kanban-final-stage"
          className="h-4 w-4 border-ds-border text-ds-accent focus:ring-ds-accent/30"
          checked={stage.is_final}
          disabled={!isAdmin || isFinalBusy}
          onChange={() => onSetFinal(stage.id)}
        />
        <span className="hidden sm:inline">Final</span>
      </label>

      {isAdmin ? (
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Renomear ${stage.name}`}
            onClick={() => onEdit(stage)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            aria-label={`Excluir ${stage.name}`}
            onClick={() => onDelete(stage)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface SettingsKanbanSectionProps {
  stages: Stage[];
  plan: Plan;
  isAdmin: boolean;
}

export function SettingsKanbanSection({ stages, plan, isAdmin }: SettingsKanbanSectionProps) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages]
  );
  const ids = useMemo(() => sorted.map((s) => s.id), [sorted]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [finalBusy, setFinalBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [renameStage, setRenameStage] = useState<Stage | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteStage, setDeleteStage] = useState<Stage | null>(null);

  const canAdd = isAdmin && (plan !== "free" || stages.length < FREE_MAX_STAGES);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !isAdmin) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextIds = arrayMove(ids, oldIndex, newIndex);
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await reorderKanbanStages(nextIds);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Ordem das etapas atualizada.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = newName.trim();
    if (!t) return;
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await addKanbanStage(t);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setNewName("");
      toast.success("Etapa criada.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleRenameSave() {
    if (!renameStage) return;
    const t = renameValue.trim();
    if (!t) {
      setErrorMessage("Nome é obrigatório.");
      return;
    }
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await updateKanbanStageName(renameStage.id, t);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setRenameStage(null);
      toast.success("Nome da etapa atualizado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteStage) return;
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await deleteKanbanStage(deleteStage.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setDeleteStage(null);
      toast.success("Etapa removida.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleSetFinal(stageId: string) {
    setErrorMessage(null);
    setFinalBusy(true);
    try {
      const res = await setFinalKanbanStage(stageId);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Etapa final de entrega atualizada.");
      router.refresh();
    } finally {
      setFinalBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="settings-kanban-heading">
      <div>
        <h2 id="settings-kanban-heading" className="text-lg font-semibold text-ds-ink">
          Kanban
        </h2>
        <p className="mt-1 text-sm text-ds-muted">
          Etapas do quadro de edição, cores e etapa final. Ordene, renomeie e defina a entrega final
          — o quadro em Edições usa estas colunas.
        </p>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-ds-muted" role="status">
          Apenas administradores podem alterar etapas. Você pode visualizar a ordem atual abaixo.
        </p>
      ) : null}

      {plan === "free" && stages.length >= FREE_MAX_STAGES ? (
        <p className="rounded-ds-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No plano Free o limite é {FREE_MAX_STAGES} etapas (Backup → Em Edição → Em Aprovação →
          Entregue). Faça upgrade para o <strong>Pro</strong> para adicionar mais colunas ao fluxo.
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

      <Card className="p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {sorted.map((stage) => (
                <li key={stage.id}>
                  <SortableStageRow
                    stage={stage}
                    isAdmin={isAdmin}
                    disabled={pending}
                    onEdit={(s) => {
                      setRenameStage(s);
                      setRenameValue(s.name);
                      setErrorMessage(null);
                    }}
                    onDelete={(s) => {
                      setDeleteStage(s);
                      setErrorMessage(null);
                    }}
                    onSetFinal={handleSetFinal}
                    isFinalBusy={finalBusy}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {sorted.length === 0 ? (
          <p className="mt-4 text-sm text-ds-muted">Nenhuma etapa cadastrada.</p>
        ) : null}
      </Card>

      {isAdmin ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="new-stage-name"
              label="Nova etapa"
              placeholder="Nome da coluna"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={pending || !canAdd}
            />
          </div>
          <Button type="submit" disabled={pending || !canAdd || !newName.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar
          </Button>
        </form>
      ) : null}

      <Modal
        open={Boolean(renameStage)}
        onClose={() => setRenameStage(null)}
        title="Renomear etapa"
        size="md"
      >
        {renameStage ? (
          <div className="flex flex-col gap-4">
            <Input
              id="rename-stage"
              label="Nome"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setRenameStage(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleRenameSave} disabled={pending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteStage)}
        onClose={() => setDeleteStage(null)}
        title="Excluir etapa"
        size="sm"
      >
        {deleteStage ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ds-muted">
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-ds-ink">{deleteStage.name}</span>? Não pode haver
              jobs nesta etapa.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDeleteStage(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
                Excluir
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
