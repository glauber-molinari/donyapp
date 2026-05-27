import { escapeHtml } from "@/lib/email/delivery-html";
import {
  transactionalCtaButton,
  transactionalEmailLayout,
  transactionalFallbackLink,
  transactionalFooter,
} from "@/lib/email/transactional-email-layout";

export function buildInviteEmailHtml(params: {
  accountName: string;
  inviteUrl: string;
  adminName?: string;
}): string {
  const accountName = escapeHtml(params.accountName);
  const adminName = params.adminName ? escapeHtml(params.adminName) : null;
  const url = escapeHtml(params.inviteUrl);
  const who = adminName ?? accountName;

  return transactionalEmailLayout(`
  <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">Você foi convidado para colaborar</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
    <strong>${who}</strong> convidou você para fazer parte da conta <strong>${accountName}</strong> no Dony.app.
  </p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
    O Dony.app é uma plataforma de gestão de estúdio para fotógrafos e videomakers. Ao aceitar este convite, você terá acesso ao espaço de trabalho compartilhado da conta.
  </p>
  ${transactionalCtaButton(url, "Aceitar convite")}
  ${transactionalFallbackLink(url)}
  ${transactionalFooter("Se você não esperava este convite, pode ignorar esta mensagem com segurança. O link expira em 7 dias.")}
`);
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
