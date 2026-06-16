/** Ordenação natural de nomes de arquivo (1, 2, 10 — como no Windows Explorer). */
export function compareFilenames(
  a: string,
  b: string,
  direction: "asc" | "desc" = "asc"
): number {
  const result = a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function sortByFilename<T extends { filename: string }>(
  items: T[],
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => compareFilenames(a.filename, b.filename, direction));
}
