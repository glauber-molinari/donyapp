import type { DeadlineBadgeValue } from "@/components/ui/badge";

export type DeadlineTimelineTone = "danger" | "warn" | "ok" | "muted" | "done";

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Badge de prazo só para jobs não entregues: atrasado ou próximo (≤3 dias). */
export function deadlineBadge(
  deadlineYmd: string,
  stageIsFinal: boolean
): DeadlineBadgeValue | null {
  if (stageIsFinal) return null;
  const deadline = parseLocalDate(deadlineYmd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "upcoming";
  return null;
}

export function formatDeadlinePt(ymd: string): string {
  const d = parseLocalDate(ymd);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Preenchimento 0–100% da linha de proximidade do prazo final (mesma janela de 14 dias do dashboard),
 * sem expor número de dias — só para barra visual.
 */
export function deadlineTimelineVisual(
  deadlineYmd: string,
  stageIsFinal: boolean
): { fillPct: number; tone: DeadlineTimelineTone } {
  if (stageIsFinal) {
    return { fillPct: 100, tone: "done" };
  }
  const deadline = parseLocalDate(deadlineYmd.slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
  if (Number.isNaN(diffDays)) {
    return { fillPct: 0, tone: "muted" };
  }
  if (diffDays < 0) {
    return { fillPct: 100, tone: "danger" };
  }
  const capped = Math.min(14, diffDays);
  const fillPct = Math.round(((14 - capped) / 14) * 100);
  let tone: DeadlineTimelineTone = "muted";
  if (diffDays === 0) tone = "warn";
  else if (diffDays <= 3) tone = "warn";
  else if (diffDays <= 10) tone = "ok";
  return { fillPct, tone };
}

/** Rótulo acessível para a barra de prazo (sem mencionar dias). */
export function deadlineTimelineAriaText(tone: DeadlineTimelineTone): string {
  switch (tone) {
    case "danger":
      return "Prazo final já passou";
    case "warn":
      return "Prazo final muito próximo ou é hoje";
    case "ok":
      return "Prazo final se aproximando";
    case "done":
      return "Job na etapa de entrega";
    default:
      return "Prazo final ainda distante";
  }
}
