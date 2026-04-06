/**
 * HTML responsivo simples para e-mail de material entregue (PRODUCT.md).
 * O corpo é texto livre do usuário (escapado); remetente técnico + reply-to na API.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDeliveryEmailHtml(bodyText: string): string {
  const safe = escapeHtml(bodyText);
  const bodyHtml = safe
    .split("\n")
    .map((line) =>
      line.length === 0 ? '<p style="margin:0 0 8px;font-size:0;">&nbsp;</p>' : `<p style="margin:0 0 12px;color:#1a1a1a;font-size:16px;line-height:1.55;">${line}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Material pronto</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f6f4ef;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
          <tr>
            <td style="padding:28px 24px 32px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#888888;text-align:center;font-family:system-ui,sans-serif;">
          Mensagem enviada pelo dony
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
