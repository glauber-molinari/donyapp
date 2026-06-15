function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface GallerySelectionEmailProps {
  galleryTitle: string;
  photoCount: number;
  clientNote: string | null;
  galleryUrl: string;
}

export function buildGallerySelectionHtml({
  galleryTitle,
  photoCount,
  clientNote,
  galleryUrl,
}: GallerySelectionEmailProps): string {
  const safeTitle = escapeHtml(galleryTitle);
  const safeUrl = escapeHtml(galleryUrl);
  const noteBlock = clientNote
    ? `<div style="background:#f6f4ef;border-left:3px solid #ff5500;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:#3a3230;font-style:italic;">${escapeHtml(clientNote)}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seleção recebida</title></head>
<body style="margin:0;padding:0;background:#f6f4ef;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#ff5500;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Seleção recebida 🎉</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#3a3230;">
              Seu cliente selecionou <strong>${photoCount} foto${photoCount !== 1 ? "s" : ""}</strong> da galeria
              <strong>${safeTitle}</strong>.
            </p>
            ${noteBlock}
            <p style="margin:20px 0 0;font-size:14px;color:#6b5f5a;">
              Clique no botão abaixo para ver a seleção completa no Dony.
            </p>
            <a href="${safeUrl}"
               style="display:inline-block;margin-top:16px;background:#ff5500;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;text-decoration:none;">
              Ver seleção
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f0ece8;">
            <p style="margin:0;font-size:12px;color:#9e8f89;">Enviado pelo Dony.app · Gestão de pós-produção para fotógrafos</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
