export type DeliveryTemplateVars = {
  contactName: string | null;
  deliveryLink: string | null;
  senderName: string | null;
  jobName: string;
};

/**
 * Substitui placeholders do template salvo em Configurações → E-mail.
 * Placeholders: {{nome_cliente}}, {{nome_job}}, {{link_material}}, {{nome_remetente}}
 */
export function applyDeliveryPlaceholders(template: string, vars: DeliveryTemplateVars): string {
  const nomeCliente = vars.contactName?.trim() || "Cliente";
  const nomeJob = vars.jobName.trim() || "Job";
  const link =
    vars.deliveryLink?.trim() ||
    "(adicione o link do material no job, se ainda não tiver.)";
  const remetente = vars.senderName?.trim() || "Seu estúdio";

  return template
    .replace(/\{\{nome_cliente\}\}/g, nomeCliente)
    .replace(/\{\{nome_job\}\}/g, nomeJob)
    .replace(/\{\{link_material\}\}/g, link)
    .replace(/\{\{nome_remetente\}\}/g, remetente);
}

export function defaultDeliverySubject(): string {
  return "Seu material está pronto! 📸";
}

/** Modelo sugerido com placeholders (Configurações → E-mail). */
export const DEFAULT_DELIVERY_BODY_TEMPLATE = `Olá {{nome_cliente}},

Seu material está finalizado e pronto para você!

🔗 Link de acesso: {{link_material}}

Qualquer dúvida, estou à disposição.

{{nome_remetente}}`;

export function buildFallbackDeliveryBody(vars: DeliveryTemplateVars): string {
  const greeting = vars.contactName ? `Olá ${vars.contactName},` : "Olá,";
  const linkLine = vars.deliveryLink
    ? `🔗 Link de acesso: ${vars.deliveryLink}`
    : "🔗 Link de acesso: (adicione o link do material no job, se ainda não tiver.)";
  const sig = vars.senderName?.trim() || "Seu estúdio";
  return `${greeting}\n\nSeu material está finalizado e pronto para você!\n\n${linkLine}\n\nQualquer dúvida, estou à disposição.\n\n${sig}`;
}
