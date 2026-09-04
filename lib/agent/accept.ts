/**
 * Content negotiation helpers aligned with acceptmarkdown.com (Accept parsing + Vary).
 */

export type AcceptEntry = { type: string; q: number; specificity: number };

const DEFAULT_PRODUCES = ["text/html", "text/markdown"] as const;

export function parseAccept(header: string): AcceptEntry[] {
  return header.split(",").map((raw) => {
    const parts = raw
      .trim()
      .split(";")
      .map((s) => s.trim());
    const type = (parts[0] ?? "*/*").toLowerCase();
    let q = 1;
    for (const param of parts.slice(1)) {
      const [name, value] = param.split("=").map((s) => s.trim());
      if (name === "q") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
      }
    }
    const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
    return { type, q, specificity };
  });
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) {
    return candidate.startsWith(entry.type.slice(0, -1));
  }
  return entry.type === candidate;
}

/**
 * Returns the preferred media type among `produces`, or null when the client
 * explicitly rejects all of them (406 case). Missing Accept → first produce.
 */
export function preferredType(
  header: string | null,
  produces: readonly string[] = DEFAULT_PRODUCES,
): string | null {
  if (!header) return produces[0] ?? null;
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0] ?? null;

  let bestType: string | null = null;
  let bestQ = -1;
  let bestPosition = Infinity;

  for (const candidate of produces) {
    let matched: AcceptEntry | null = null;
    let matchedPosition = Infinity;
    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx]!;
      if (!matches(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e;
        matchedPosition = idx;
      }
    }
    if (matched === null) continue;
    if (matched.q <= 0) continue;

    if (
      matched.q > bestQ ||
      (matched.q === bestQ && matchedPosition < bestPosition)
    ) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      bestType = candidate;
    }
  }

  return bestType;
}

export function prefersMarkdown(acceptHeader: string | null): boolean {
  return preferredType(acceptHeader) === "text/markdown";
}

/** Ensure Vary includes Accept (and Accept-Encoding for negotiated markdown). */
export function appendVary(
  headers: Headers,
  tokens: readonly string[] = ["Accept", "Accept-Encoding"],
): void {
  const existing = headers.get("Vary");
  const current = existing
    ? existing.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const lower = new Set(current.map((t) => t.toLowerCase()));
  for (const token of tokens) {
    if (!lower.has(token.toLowerCase())) {
      current.push(token);
      lower.add(token.toLowerCase());
    }
  }
  headers.set("Vary", current.join(", "));
}

export function markdownResponseHeaders(): HeadersInit {
  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
  });
  appendVary(headers);
  return headers;
}
