/** Nome exibido na caixa de entrada (alinhado ao Supabase Auth e à marca). */
export const RESEND_SENDER_DISPLAY_NAME = "Dony.app";

/**
 * Monta o remetente Resend sempre como `Dony.app <email@dominio>`.
 * Lê o e-mail de RESEND_FROM (com ou sem nome) e ignora o nome antigo da variável.
 */
export function getResendFrom(): string {
  const raw = process.env.RESEND_FROM?.trim();
  if (!raw) return "";

  const bracket = /^[^<]*<([^>]+)>$/.exec(raw);
  const email = (bracket?.[1] ?? raw).trim();

  if (!email.includes("@")) {
    return raw;
  }

  return `${RESEND_SENDER_DISPLAY_NAME} <${email}>`;
}
