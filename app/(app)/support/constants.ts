import type { SupportTicketCategory } from "@/types/database";

export const SUPPORT_CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: "problema_tecnico", label: "Problema técnico (bug, erro)" },
  { value: "duvida", label: "Dúvida sobre funcionalidade" },
  { value: "cobranca", label: "Cobrança e planos" },
  { value: "sugestao", label: "Sugestão de melhoria" },
  { value: "outro", label: "Outro" },
];
