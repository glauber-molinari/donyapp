import { escapeHtml } from "@/lib/email/delivery-html";

export function buildInviteEmailHtml(params: {
  accountName: string;
  inviteUrl: string;
}): string {
  const name = escapeHtml(params.accountName);
  const url = escapeHtml(params.inviteUrl);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1a1a1a;">Convite para a equipe</p>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#333;">
            Você foi convidado para colaborar na conta <strong>${name}</strong> no dony.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${url}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px;">Aceitar convite</a>
          </p>
          <p style="margin:0;font-size:13px;color:#666;">Se o botão não funcionar, copie e cole este link no navegador:<br /><span style="word-break:break-all;color:#444;">${url}</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
