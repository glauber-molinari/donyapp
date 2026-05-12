import { escapeHtml } from "@/lib/email/delivery-html";

export function buildInviteEmailHtml(params: {
  accountName: string;
  inviteUrl: string;
  adminName?: string;
}): string {
  const accountName = escapeHtml(params.accountName);
  const adminName = params.adminName ? escapeHtml(params.adminName) : null;
  const url = escapeHtml(params.inviteUrl);
  const who = adminName ?? accountName;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table style="max-width:560px;width:100%;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#ea580c;letter-spacing:0.06em;text-transform:uppercase;">Dony.app</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">Você foi convidado para colaborar</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
            <strong>${who}</strong> convidou você para fazer parte da conta <strong>${accountName}</strong> no Dony.app.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
            O Dony.app é uma plataforma de gestão de estúdio para fotógrafos e videomakers. Ao aceitar este convite, você terá acesso ao espaço de trabalho compartilhado da conta.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Aceitar convite</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#555555;">Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style="margin:0 0 20px;font-size:13px;word-break:break-all;color:#333333;">${url}</p>
          <p style="margin:0;font-size:12px;color:#666666;line-height:1.5;border-top:1px solid #e8e4dc;padding-top:16px;">Se você não esperava este convite, pode ignorar esta mensagem com segurança. O link expira em 7 dias.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildInviteEmailText(params: {
  accountName: string;
  inviteUrl: string;
  adminName?: string;
}): string {
  const who = params.adminName || params.accountName;
  return `${who} convidou você para colaborar na conta ${params.accountName} no Dony.app.

O Dony.app é uma plataforma de gestão de estúdio para fotógrafos e videomakers. Ao aceitar este convite, você terá acesso ao espaço de trabalho compartilhado da conta.

Para aceitar o convite, acesse o link abaixo:
${params.inviteUrl}

Se você não esperava este convite, pode ignorar esta mensagem com segurança. O link expira em 7 dias.`;
}
