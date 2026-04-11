/**
 * Paleta de fundos das colunas (classes Tailwind) + suporte a cor customizada em `#RRGGBB`.
 * Ordem alinhada ao provisionamento padrão; depois tons pastel extras para novas etapas.
 */
export const KANBAN_STAGE_TAILWIND_COLORS: readonly string[] = [
  "bg-ds-accent/10",
  "bg-amber-50",
  "bg-blue-50",
  "bg-pink-50",
  "bg-green-50",
  "bg-violet-50",
  "bg-cyan-50",
  "bg-orange-50",
  "bg-teal-50",
  "bg-sky-50",
  "bg-rose-50",
  "bg-lime-50",
  "bg-fuchsia-50",
  "bg-indigo-50",
] as const;

const TAILWIND_SET = new Set(KANBAN_STAGE_TAILWIND_COLORS);

export function isKanbanTailwindStageColor(value: string): boolean {
  return TAILWIND_SET.has(value.trim());
}

export function isKanbanHexStageColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function isValidKanbanStageColor(value: string): boolean {
  const v = value.trim();
  return isKanbanTailwindStageColor(v) || isKanbanHexStageColor(v);
}

/** Próxima cor sugerida: prioriza tons da paleta que ainda não estão em uso nesta conta. */
export function pickNextKanbanStageColor(existingColors: string[]): string {
  const used = new Set(existingColors.map((c) => c?.trim()).filter(Boolean));
  for (const c of KANBAN_STAGE_TAILWIND_COLORS) {
    if (!used.has(c)) return c;
  }
  const n = existingColors.length;
  return KANBAN_STAGE_TAILWIND_COLORS[n % KANBAN_STAGE_TAILWIND_COLORS.length]!;
}
