/**
 * Layout base dos e-mails transacionais Dony (convite, confirmação Supabase, etc.).
 */
export function transactionalEmailLayout(contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" style="max-width:560px;width:100%;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#ea580c;letter-spacing:0.06em;text-transform:uppercase;">Dony.app</p>
          ${contentHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function transactionalCtaButton(href: string, label: string): string {
  return `<p style="margin:0 0 24px;">
  <a href="${href}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>
</p>`;
}

export function transactionalFallbackLink(url: string): string {
  return `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#555555;">Se o botão não funcionar, copie e cole este link no navegador:</p>
<p style="margin:0 0 20px;font-size:13px;word-break:break-all;color:#333333;">${url}</p>`;
}

export function transactionalFooter(note: string): string {
  return `<p style="margin:0;font-size:12px;color:#666666;line-height:1.5;border-top:1px solid #e8e4dc;padding-top:16px;">${note}</p>`;
}
