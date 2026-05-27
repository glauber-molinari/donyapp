import type { DeadlineBadgeValue } from "@/components/ui/badge";

export type DeadlineTimelineTone = "danger" | "warn" | "ok" | "muted" | "done";

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/**
 * Formata deadline seguindo a regra DS:
 *   hoje           → "hoje"
 *   amanhã         → "amanhã"
 *   +2 a 5 dias    → "em N dias"
 *   > 5 dias       → "DD/MM"
 *   outro ano      → "DD/MM/AA"
 *   atrasado       → "atrasado Nd"
 */
export function formatDeadlinePt(ymd: string): string {
  const deadline = parseLocalDate(ymd.slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return `atrasado ${n}d`;
  }
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "amanhã";
  if (diffDays <= 5) return `em ${diffDays} dias`;

  const dd = String(deadline.getDate()).padStart(2, "0");
  const mm = String(deadline.getMonth() + 1).padStart(2, "0");

  if (deadline.getFullYear() !== today.getFullYear()) {
    const yy = String(deadline.getFullYear()).slice(2);
    return `${dd}/${mm}/${yy}`;
  }

  return `${dd}/${mm}`;
}

/** Sempre retorna "DD/MM" (ou "DD/MM/AA" em outro ano) — nunca texto relativo. */
export function formatDatePt(ymd: string): string {
  const d = parseLocalDate(ymd.slice(0, 10));
  const today = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  if (d.getFullYear() !== today.getFullYear()) {
    return `${dd}/${mm}/${String(d.getFullYear()).slice(2)}`;
  }
  return `${dd}/${mm}`;
}

/** Badge de prazo (jobs não entregues): atrasado ou próximo (≤5 dias, per DS). */
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
  if (diffDays <= 5) return "upcoming";
  return null;
}

/**
 * Preenchimento 0–100% da linha de proximidade do prazo (janela de 14 dias),
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
  if (diffDays <= 5) tone = "warn";
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
