/**
 * Acesso ao painel admin da plataforma (Donyapp).
 * Defina DONYAPP_ADMIN_EMAILS com e-mails separados por vírgula (case-insensitive).
 */
export function getPlatformAdminEmails(): string[] {
  const raw = process.env.DONYAPP_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getPlatformAdminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}
