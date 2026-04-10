/** Texto puro a partir de HTML simples (cards / validação). */
export function textFromHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function snippetFromHtml(html: string, maxLen: number): string {
  const t = textFromHtml(html);
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

export type NotePriority = "none" | "low" | "medium" | "high";

export const NOTE_PRIORITIES: readonly NotePriority[] = ["none", "low", "medium", "high"] as const;

export function isNotePriority(v: string): v is NotePriority {
  return NOTE_PRIORITIES.includes(v as NotePriority);
}

export function notePriorityLabel(p: NotePriority): string {
  switch (p) {
    case "low":
      return "Baixa";
    case "medium":
      return "Média";
    case "high":
      return "Alta";
    default:
      return "Sem prioridade";
  }
}

export function notePriorityPillClass(p: NotePriority): string {
  switch (p) {
    case "low":
      return "bg-blue-50 text-blue-900";
    case "medium":
      return "bg-amber-50 text-amber-950";
    case "high":
      return "bg-red-50 text-red-900";
    default:
      return "bg-ds-elevated text-ds-muted";
  }
}

const CATEGORY_PILL_CLASSES = [
  "bg-ds-accent/10 text-ds-accent-ink",
  "bg-violet-100 text-violet-900",
  "bg-green-50 text-green-900",
  "bg-pink-50 text-pink-900",
  "bg-blue-50 text-blue-900",
  "bg-amber-50 text-amber-950",
] as const;

export function categoryPillClass(tag: string, index: number): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h + tag.charCodeAt(i) * (i + 1)) % 997;
  const idx = (h + index) % CATEGORY_PILL_CLASSES.length;
  return CATEGORY_PILL_CLASSES[idx] ?? CATEGORY_PILL_CLASSES[0];
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Notas antigas em texto puro viram HTML seguro no editor. */
export function plainTextToEditorHtml(text: string): string {
  const t = text.trim();
  if (!t) return "<p><br></p>";
  const parts = t.split(/\n\s*\n/);
  return parts
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function normalizeNoteContentForEditor(raw: string): string {
  const t = raw.trim();
  if (!t) return "<p><br></p>";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return plainTextToEditorHtml(raw);
}
