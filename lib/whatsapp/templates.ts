export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function daysLabel(days: number): string {
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export function jobDeadlineMessage(
  jobName: string,
  clientName: string | null,
  daysLeft: number,
  deadline: string
): string {
  const when = daysLabel(daysLeft);
  const client = clientName ? ` para *${clientName}*` : "";
  return `⚠️ *Prazo de entrega ${when}*\n\nEdição: *${jobName}*${client}\nData limite: ${formatDateBR(deadline)}\n\n_Acesse o Donyapp para mais detalhes._`;
}

export function internalDeadlineMessage(
  jobName: string,
  daysLeft: number,
  deadline: string
): string {
  const when = daysLabel(daysLeft);
  return `🔴 *Prazo interno ${when}*\n\nEdição: *${jobName}*\nDeadline interno: ${formatDateBR(deadline)}\n\n_Acesse o Donyapp para mais detalhes._`;
}

export function taskDeadlineMessage(
  taskName: string,
  daysLeft: number,
  deadline: string
): string {
  const when = daysLabel(daysLeft);
  return `📋 *Tarefa com prazo ${when}*\n\nTarefa: *${taskName}*\nData limite: ${formatDateBR(deadline)}\n\n_Acesse o Donyapp para mais detalhes._`;
}

export function overdueJobMessage(
  jobName: string,
  clientName: string | null,
  daysOverdue: number,
  deadline: string
): string {
  const client = clientName ? ` para *${clientName}*` : "";
  return `🚨 *Edição atrasada há ${daysOverdue} dia${daysOverdue > 1 ? "s" : ""}*\n\nEdição: *${jobName}*${client}\nPrazo era: ${formatDateBR(deadline)}\n\n_Resolva agora no Donyapp._`;
}

export function overdueTaskMessage(
  taskName: string,
  daysOverdue: number,
  deadline: string
): string {
  return `🚨 *Tarefa atrasada há ${daysOverdue} dia${daysOverdue > 1 ? "s" : ""}*\n\nTarefa: *${taskName}*\nPrazo era: ${formatDateBR(deadline)}\n\n_Resolva agora no Donyapp._`;
}

export function weeklySummaryMessage(
  studioName: string,
  jobs: { name: string; deadline: string }[],
  tasks: { name: string; deadline: string }[],
  overdueJobs: number,
  overdueTasks: number
): string {
  let msg = `📅 *Resumo da semana — ${studioName}*\n\n`;

  if (overdueJobs > 0 || overdueTasks > 0) {
    msg += `🚨 *Pendências atrasadas:* ${overdueJobs} edição(ões), ${overdueTasks} tarefa(s)\n\n`;
  }

  if (jobs.length > 0) {
    msg += `📸 *Entregas para os próximos 7 dias:*\n`;
    jobs.slice(0, 5).forEach((j) => {
      msg += `• ${j.name} — ${formatDateBR(j.deadline)}\n`;
    });
    if (jobs.length > 5) msg += `...e mais ${jobs.length - 5}\n`;
    msg += "\n";
  }

  if (tasks.length > 0) {
    msg += `✅ *Tarefas para os próximos 7 dias:*\n`;
    tasks.slice(0, 5).forEach((t) => {
      msg += `• ${t.name} — ${formatDateBR(t.deadline)}\n`;
    });
    if (tasks.length > 5) msg += `...e mais ${tasks.length - 5}\n`;
    msg += "\n";
  }

  if (jobs.length === 0 && tasks.length === 0 && overdueJobs === 0 && overdueTasks === 0) {
    msg += `✨ Nenhuma entrega ou tarefa para esta semana. Boa semana!\n\n`;
  }

  msg += `_Donyapp — Gestão de pós-produção_`;

  return msg;
}

export function clientDeliveryMessage(
  senderName: string,
  jobName: string,
  deliveryLink: string,
  customBody?: string | null
): string {
  if (customBody) {
    return customBody
      .replace(/\{\{nome_job\}\}/g, jobName)
      .replace(/\{\{link_material\}\}/g, deliveryLink)
      .replace(/\{\{nome_remetente\}\}/g, senderName);
  }

  return `Olá! 😊\n\n*${senderName}* finalizou as edições de *${jobName}* e enviou o material para você:\n\n${deliveryLink}\n\n_Enviado via Donyapp_`;
}

export function testMessage(studioName: string): string {
  return `✅ *Teste de notificação Donyapp*\n\nOlá, *${studioName}*! As notificações via WhatsApp estão configuradas corretamente.\n\n_Donyapp — Gestão de pós-produção_`;
}
