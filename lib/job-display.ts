import type { DeadlineBadgeValue } from "@/components/ui/badge";

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
