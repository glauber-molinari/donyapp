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
  initializeAlbumStages,
  reorderKanbanStages,
  setFinalKanbanStage,
  updateKanbanStageDetails,
} from "./kanban-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { kanbanStageAccentHex } from "@/lib/kanban-stage-accent";
import {
  isValidKanbanStageColor,
  KANBAN_STAGE_TAILWIND_COLORS,
  pickNextKanbanStageColor,
} from "@/lib/kanban-stage-colors";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BoardType, Database } from "@/types/database";

type Stage = Database["public"]["Tables"]["kanban_stages"]["Row"];
type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];

const FREE_MAX_STAGES = 4;

function StageColorSwatch({
  color,
  className,
  title,
}: {
  color: string;
  className?: string;
  title?: string;
}) {
  const trimmed = color?.trim() ?? "";
  if (trimmed.startsWith("#")) {
    return (
      <div
        className={cn("rounded-lg border border-ds-border/80", className)}
        style={{ backgroundColor: trimmed }}
        title={title}
        aria-hidden
      />
    );
  }
  return (
    <div
      className={cn("rounded-lg border border-ds-border/80", trimmed, className)}
      title={title}
      aria-hidden
    />
  );
}

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
          className="touch-none text-ds-muted-2 hover:text-ds-ink"
          aria-label="Arrastar etapa"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 shrink-0" />
        </button>
      ) : (
        <span className="w-5 shrink-0" aria-hidden />
      )}

      <StageColorSwatch
        color={stage.color}
        className="h-8 w-8 shrink-0"
        title="Cor da coluna no quadro"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ds-ink">{stage.name}</p>
        <p className="text-xs text-ds-muted-2">Posição {stage.position}</p>
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
            className="h-8 w-8 p-0 text-ds-danger hover:bg-ds-danger-soft"
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
  boardType?: BoardType;
}

export function SettingsKanbanSection({
  stages,
  plan,
  isAdmin,
  boardType = "edicao",
}: SettingsKanbanSectionProps) {
  const router = useRouter();
  const isAlbumBoard = boardType === "album";
  const isProRequiredForBoard = isAlbumBoard;
  const albumLocked = isAlbumBoard && plan !== "pro";

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
  const [renameColor, setRenameColor] = useState("");
  const [deleteStage, setDeleteStage] = useState<Stage | null>(null);

  const nextPreviewColor = useMemo(
    () => pickNextKanbanStageColor(sorted.map((s) => s.color)),
    [sorted]
  );

  const canAdd =
    isAdmin &&
    !albumLocked &&
    (isProRequiredForBoard || plan !== "free" || stages.length < FREE_MAX_STAGES);

  const canInitializeAlbum = isAlbumBoard && plan === "pro" && stages.length === 0;

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
      const res = await reorderKanbanStages(nextIds, boardType);
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
      const res = await addKanbanStage(t, boardType);
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

  async function handleInitializeAlbum() {
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await initializeAlbumStages();
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Etapas padrão de álbum criadas.");
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
      const res = await updateKanbanStageDetails(renameStage.id, t, renameColor);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setRenameStage(null);
      toast.success("Etapa atualizada.");
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

  const headingId = `settings-kanban-heading-${boardType}`;
  const heading = isAlbumBoard ? "Etapas do quadro de Álbuns" : "Etapas do quadro de Edições";
  const description = isAlbumBoard
    ? "Etapas da produção física do álbum (diagramação, gráfica, transporte). Disponível no plano Pro."
    : "Etapas do quadro de edição, cores e etapa final. O quadro em Edições usa estas colunas.";

  return (
    <section className="flex flex-col gap-4" aria-labelledby={headingId}>
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-ds-ink">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-ds-muted">{description}</p>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-ds-muted" role="status">
          Apenas administradores podem alterar etapas. Você pode visualizar a ordem atual abaixo.
        </p>
      ) : null}

      {albumLocked ? (
        <Alert variant="warn">
          Quadro de Álbuns está disponível no plano <strong>Pro</strong>. Faça upgrade em
          Configurações → Plano para configurar as etapas.
        </Alert>
      ) : null}

      {!isAlbumBoard && plan === "free" && stages.length >= FREE_MAX_STAGES ? (
        <Alert variant="warn">
          No plano Free o limite é {FREE_MAX_STAGES} etapas (Backup → Em Edição → Em Aprovação →
          Entregue). Faça upgrade para o <strong>Pro</strong> para adicionar mais colunas ao fluxo.
        </Alert>
      ) : null}

      {canInitializeAlbum ? (
        <div className="flex flex-col gap-2 rounded-ds-lg border border-ds-border bg-ds-cream/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ds-muted">
            Nenhuma etapa de álbum criada ainda. Inicialize com as etapas padrão:
            Diagramação → Aprovação → Gráfica → Produção → Transporte → Entregue.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={handleInitializeAlbum}
          >
            Inicializar etapas padrão
          </Button>
        </div>
      ) : null}

      {errorMessage ? (
        <Alert variant="danger">{errorMessage}</Alert>
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
                      const c = s.color?.trim() ?? "";
                      setRenameColor(
                        isValidKanbanStageColor(c)
                          ? c
                          : pickNextKanbanStageColor(sorted.map((x) => x.color))
                      );
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
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <Input
              id="new-stage-name"
              label="Nova etapa"
              placeholder="Nome da coluna"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={pending || !canAdd}
            />
          </div>
          <div className="flex items-center gap-3 sm:shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ds-muted-2">Cor ao salvar</span>
              <StageColorSwatch color={nextPreviewColor} className="h-10 w-10" />
            </div>
            <Button type="submit" disabled={pending || !canAdd || !newName.trim()}>
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar
            </Button>
          </div>
        </form>
      ) : null}

      <Modal
        open={Boolean(renameStage)}
        onClose={() => setRenameStage(null)}
        title="Editar etapa"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenameStage(null)}>
              Fechar
            </Button>
            <Button type="button" onClick={handleRenameSave} disabled={pending}>
              Salvar
            </Button>
          </div>
        }
      >
        {renameStage ? (
          <div className="flex flex-col gap-4 p-5">
            <Input
              id="rename-stage"
              label="Nome"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-medium text-ds-ink">Cor da coluna</legend>
              <p className="text-xs text-ds-muted">
                Tons pastéis como no quadro padrão, ou uma cor personalizada abaixo.
              </p>
              <div className="flex flex-wrap gap-2">
                {KANBAN_STAGE_TAILWIND_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    title={preset}
                    aria-pressed={renameColor === preset}
                    onClick={() => setRenameColor(preset)}
                    className={cn(
                      "h-9 w-9 rounded-lg border-2 border-transparent p-0.5 transition-shadow",
                      renameColor === preset && "border-ds-accent ring-2 ring-ds-accent/20"
                    )}
                  >
                    <span className={cn("block h-full w-full rounded-md border border-ds-border/80", preset)} />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ds-muted">
                  <span>Personalizada</span>
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer overflow-hidden rounded-md border border-ds-border bg-ds-surface p-0"
                    aria-label="Escolher cor personalizada em hexadecimal"
                    value={
                      renameColor.startsWith("#")
                        ? renameColor
                        : kanbanStageAccentHex(renameColor)
                    }
                    onChange={(e) => setRenameColor(e.target.value)}
                  />
                </label>
                <StageColorSwatch color={renameColor} className="h-10 w-10" title="Prévia" />
              </div>
            </fieldset>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteStage)}
        onClose={() => setDeleteStage(null)}
        title="Excluir etapa"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteStage(null)}>
              Fechar
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
              Excluir
            </Button>
          </div>
        }
      >
        {deleteStage ? (
          <div className="p-5">
            <p className="text-sm text-ds-muted">
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-ds-ink">{deleteStage.name}</span>? Não pode haver
              jobs nesta etapa.
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
