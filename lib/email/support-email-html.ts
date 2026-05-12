import { escapeHtml } from "@/lib/email/delivery-html";

const CATEGORY_LABELS: Record<string, string> = {
  problema_tecnico: "Problema técnico",
  duvida: "Dúvida sobre funcionalidade",
  cobranca: "Cobrança e planos",
  sugestao: "Sugestão de melhoria",
  outro: "Outro",
};

export function buildNewTicketEmailHtml(params: {
  userName: string;
  userEmail: string;
  category: string;
  description: string;
  ticketId: string;
  adminUrl: string;
}): string {
  const name = escapeHtml(params.userName);
  const email = escapeHtml(params.userEmail);
  const category = escapeHtml(CATEGORY_LABELS[params.category] ?? params.category);
  const description = escapeHtml(params.description)
    .split("\n")
    .map((l) => `<p style="margin:0 0 10px;color:#1a1a1a;font-size:15px;line-height:1.55;">${l || "&nbsp;"}</p>`)
    .join("");
  const adminUrl = escapeHtml(params.adminUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:.05em;">Novo ticket de suporte</p>
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#1a1a1a;">Categoria: ${category}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:8px 12px;background:#f6f4ef;border-radius:8px 8px 0 0;font-size:12px;font-weight:600;color:#666;text-transform:uppercase;">Usuário</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;border:1px solid #e8e4dc;border-top:none;border-radius:0 0 8px 8px;font-size:15px;color:#1a1a1a;">
                ${name} &lt;${email}&gt;
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#666;text-transform:uppercase;">Mensagem</p>
          <div style="border:1px solid #e8e4dc;border-radius:8px;padding:16px;margin-bottom:24px;">
            ${description}
          </div>
          <p style="margin:0 0 24px;">
            <a href="${adminUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px;">Ver e responder ticket</a>
          </p>
          <p style="margin:0;font-size:12px;color:#666666;">ID do ticket: ${escapeHtml(params.ticketId)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildTicketReplyEmailHtml(params: {
  userName: string;
  replyContent: string;
  ticketUrl: string;
}): string {
  const name = escapeHtml(params.userName);
  const reply = escapeHtml(params.replyContent)
    .split("\n")
    .map((l) => `<p style="margin:0 0 10px;color:#1a1a1a;font-size:15px;line-height:1.55;">${l || "&nbsp;"}</p>`)
    .join("");
  const ticketUrl = escapeHtml(params.ticketUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1a1a1a;">Olá, ${name}!</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333;">
            Seu ticket de suporte foi respondido pela equipe Donyapp. Confira a resposta abaixo:
          </p>
          <div style="border-left:3px solid #ea580c;padding:12px 16px;margin-bottom:24px;background:#fdf8f5;border-radius:0 8px 8px 0;">
            ${reply}
          </div>
          <p style="margin:0 0 24px;">
            <a href="${ticketUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:15px;">Ver ticket no Donyapp</a>
          </p>
          <p style="margin:0;font-size:13px;color:#666666;">
            Se o botão não funcionar, acesse: <span style="word-break:break-all;color:#444;">${ticketUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
