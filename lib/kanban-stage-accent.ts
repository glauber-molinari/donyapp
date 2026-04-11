/**
 * Cor de destaque por etapa (borda superior da coluna e borda dos cards).
 * Chaves = `kanban_stages.color` (classes Tailwind de fundo) ou `#RRGGBB` para cor customizada.
 */
const ACCENT_BY_STAGE_COLOR: Record<string, string> = {
  "bg-ds-accent/10": "#EBC8B4",
  "bg-amber-50": "#EADFB4",
  "bg-blue-50": "#A7C1E3",
  "bg-pink-50": "#E6A8CA",
  "bg-green-50": "#B8DCC8",
  "bg-violet-50": "#C4B5FD",
  "bg-cyan-50": "#7DD3FC",
  "bg-orange-50": "#FDBA74",
  "bg-teal-50": "#5EEAD4",
  "bg-sky-50": "#7DD3FC",
  "bg-rose-50": "#FDA4AF",
  "bg-lime-50": "#BEF264",
  "bg-fuchsia-50": "#F0ABFC",
  "bg-indigo-50": "#A5B4FC",
};

export function kanbanStageAccentHex(color: string): string {
  const key = color?.trim() ?? "";
  if (/^#[0-9A-Fa-f]{6}$/.test(key)) return key;
  return ACCENT_BY_STAGE_COLOR[key] ?? "#d6d3d1";
}
