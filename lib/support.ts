const DEFAULT_SUPPORT_EMAIL = "suporte@donyapp.com";

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
}

/** mailto: com assunto e corpo opcionais (UTF-8). */
export function supportMailtoLink(options?: { subject?: string; body?: string }): string {
  const email = getSupportEmail();
  const q = new URLSearchParams();
  if (options?.subject) q.set("subject", options.subject);
  if (options?.body) q.set("body", options.body);
  const qs = q.toString();
  return qs ? `mailto:${email}?${qs}` : `mailto:${email}`;
}

/** E.164 sem + (ex.: 5511999999999). Se não configurado, retorna null. */
export function getSupportWhatsAppE164(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_E164?.replace(/\D/g, "") ?? "";
  return raw.length >= 10 ? raw : null;
}

export function supportWhatsAppLink(prefill?: string): string | null {
  const num = getSupportWhatsAppE164();
  if (!num) return null;
  const base = `https://wa.me/${num}`;
  if (!prefill?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefill.trim())}`;
}
