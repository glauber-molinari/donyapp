import { escapeHtml } from "./delivery-html";

export function buildFormNotificationHtml(params: {
  formTitle: string;
  formFieldsHtml: string;
  submissionUrl: string;
  today: string;
}): string {
  const { formTitle, formFieldsHtml, submissionUrl, today } = params;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Novo formulário recebido</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f6f4ef;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4dc;">
          <tr>
            <td style="padding:24px 24px 8px;background-color:#ff5500;">
              <p style="margin:0;font-size:12px;font-weight:600;color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;">
                Novo formulário recebido
              </p>
              <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#ffffff;">
                ${escapeHtml(formTitle)}
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${escapeHtml(today)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${formFieldsHtml}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td>
                    <a href="${escapeHtml(submissionUrl)}" style="display:inline-block;background-color:#ff5500;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">
                      Ver formulário completo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#888888;text-align:center;">
          Mensagem enviada pelo dony
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildFormFieldsHtml(
  fields: Array<{ label: string }>,
  data: Record<string, string | string[]>
): string {
  return fields
    .map(({ label }) => {
      const value = data[label] ?? "";
      const displayValue = Array.isArray(value) ? value.join(", ") : value;
      if (!displayValue) return "";
      return `<p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;line-height:1.5;">
  <strong style="display:block;font-size:12px;font-weight:600;color:#888888;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px;">${escapeHtml(label)}</strong>
  ${escapeHtml(displayValue)}
</p>`;
    })
    .filter(Boolean)
    .join("");
}
