import type { UserRole } from "@/types/database";

export type JobAssigneePickerOption = {
  token: string;
  label: string;
  email: string;
  avatarUrl: string | null;
};

type MemberLite = {
  id: string;
  name: string;
  role: UserRole;
  email: string | null;
  avatarUrl: string | null;
};
type ManualLite = {
  id: string;
  name: string;
  email: string | null;
  photoUrl: string | null;
};

function stableEmailForAvatar(email: string | null | undefined, token: string): string {
  const e = email?.trim();
  if (e) return e;
  return `${token.replace(/:/g, "-")}@assignee.local`;
}

/** Lista única (sem grupos): manuais + todos os usuários da conta, ordenada por nome. */
export function buildJobAssigneePickerOptions(
  members: MemberLite[],
  manualAssignees: ManualLite[]
): JobAssigneePickerOption[] {
  const seen = new Set<string>();
  const out: JobAssigneePickerOption[] = [];

  for (const m of manualAssignees) {
    const token = `m:${m.id}`;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push({
      token,
      label: m.name,
      email: stableEmailForAvatar(m.email, token),
      avatarUrl: m.photoUrl,
    });
  }

  for (const u of members) {
    const token = `u:${u.id}`;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push({
      token,
      label: u.name,
      email: stableEmailForAvatar(u.email, token),
      avatarUrl: u.avatarUrl,
    });
  }

  out.sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
  return out;
}
