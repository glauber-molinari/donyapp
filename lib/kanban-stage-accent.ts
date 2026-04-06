/**
 * Cor de destaque por etapa (borda superior da coluna e borda dos cards).
 * Chaves = `kanban_stages.color` (classes Tailwind de fundo legadas).
 */
const ACCENT_BY_STAGE_COLOR: Record<string, string> = {
  "bg-ds-accent/10": "#EBC8B4",
  "bg-amber-50": "#EADFB4",
  "bg-blue-50": "#A7C1E3",
  "bg-pink-50": "#E6A8CA",
  "bg-green-50": "#B8DCC8",
};

export function kanbanStageAccentHex(colorClass: string): string {
  return ACCENT_BY_STAGE_COLOR[colorClass] ?? "#d6d3d1";
}
