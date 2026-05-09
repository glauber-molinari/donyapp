import { escapeHtml } from "@/lib/email/delivery-html";

export function buildTaskAssignmentHtml(params: {
  taskName: string;
  description: string | null;
  inviterName: string;
  deadline: string;
  appUrl: string;
}): string {
  const taskName = escapeHtml(params.taskName);
  const description = params.description ? escapeHtml(params.description) : null;
  const inviterName = escapeHtml(params.inviterName);
  const deadline = escapeHtml(params.deadline);
  const appUrl = escapeHtml(params.appUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f5f2ef;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table style="max-width:560px;width:100%;background:#fff;border-radius:16px;border:1px solid #e8e4df;padding:32px 28px;">
        <tr><td>
          <p style="margin:0 0 24px;font-size:13px;font-weight:700;color:#ff5500;letter-spacing:0.08em;text-transform:uppercase;">dony</p>
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0c0a09;line-height:1.25;">Você foi adicionado a uma tarefa</p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#57534e;">
            <strong style="color:#0c0a09;">${inviterName}</strong> adicionou você à seguinte tarefa:
          </p>
          <div style="background:#f5f2ef;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0c0a09;">${taskName}</p>
            ${description ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#57534e;">${description}</p>` : ""}
            <p style="margin:0;font-size:13px;color:#78716c;"><strong>Prazo:</strong> ${deadline}</p>
          </div>
          <p style="margin:0 0 32px;">
            <a href="${appUrl}" style="display:inline-block;background:#ff5500;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:15px;">Ver tarefa no dony</a>
          </p>
          <p style="margin:0;font-size:12px;color:#78716c;line-height:1.5;">Este e-mail foi enviado automaticamente pelo Dony — gestão de estúdio para fotógrafos.<br />Se você não esperava este convite, pode ignorar esta mensagem.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
