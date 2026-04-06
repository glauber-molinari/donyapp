import type { JobType } from "@/types/database";

import { normalizeOptionalText } from "@/lib/validation/contact";

const JOB_TYPES: JobType[] = ["foto", "video", "foto_video"];

export function parseJobType(value: unknown): JobType | null {
  if (typeof value !== "string") return null;
  return JOB_TYPES.includes(value as JobType) ? (value as JobType) : null;
}

/** yyyy-mm-dd */
export function parseDeadline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(t + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return t;
}

export function normalizeOptionalUrl(value: FormDataEntryValue | null): string | null {
  const raw = normalizeOptionalText(value);
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function parseOptionalContactId(value: FormDataEntryValue | null): string | null {
  if (value == null || typeof value !== "string") return null;
  const t = value.trim();
  return t.length ? t : null;
}

/** id não vazio (uuid vindo do formulário) */
export function parseRequiredId(value: unknown, emptyMessage: string): string | { error: string } {
  if (typeof value !== "string") return { error: emptyMessage };
  const t = value.trim();
  if (!t) return { error: emptyMessage };
  return t;
}
