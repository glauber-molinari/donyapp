import {
  transactionalCtaButton,
  transactionalEmailLayout,
  transactionalFallbackLink,
  transactionalFooter,
} from "@/lib/email/transactional-email-layout";

/**
 * Templates para colar no Supabase Dashboard:
 * Authentication → Email Templates
 *
 * Variáveis Go do Supabase: https://supabase.com/docs/guides/auth/auth-email-templates
 * Use {{ .ConfirmationURL }}, {{ .Email }}, etc. — não escape no painel.
 */

/** Assunto: Authentication → Confirm signup → Subject */
export const SUPABASE_CONFIRM_SIGNUP_SUBJECT = "Confirme seu cadastro no Dony.app";

/**
 * Corpo HTML para o Supabase — use o arquivo pronto para colar:
 * docs/supabase-confirm-signup-body.html (HTML puro, sem TypeScript).
 *
 * A constante abaixo é só referência no código; NÃO cole isto no painel do Supabase.
 */
export const SUPABASE_CONFIRM_SIGNUP_BODY_HTML = transactionalEmailLayout(`
  <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">Confirme seu cadastro</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
    Você criou uma conta no Dony.app com o e-mail <strong>{{ .Email }}</strong>.
    Clique no botão abaixo para confirmar seu endereço e começar a usar o app.
  </p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
    O Dony.app é uma plataforma de gestão de estúdio para fotógrafos e videomakers.
  </p>
  ${transactionalCtaButton("{{ .ConfirmationURL }}", "Confirmar e-mail")}
  ${transactionalFallbackLink("{{ .ConfirmationURL }}")}
  ${transactionalFooter("Se você não criou esta conta, pode ignorar esta mensagem com segurança.")}
`);

/** Versão texto simples (campo Message body plain, se disponível). */
export const SUPABASE_CONFIRM_SIGNUP_BODY_TEXT = `Confirme seu cadastro no Dony.app

Você criou uma conta com o e-mail {{ .Email }}.

Para confirmar, acesse:
{{ .ConfirmationURL }}

Se você não criou esta conta, ignore esta mensagem.`;

/** Assunto: Authentication → Reset password → Subject */
export const SUPABASE_RESET_PASSWORD_SUBJECT = "Redefinir senha do Dony.app";

export const SUPABASE_RESET_PASSWORD_BODY_HTML = transactionalEmailLayout(`
  <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">Redefinir senha</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
    Recebemos um pedido para alterar a senha da conta <strong>{{ .Email }}</strong> no Dony.app.
  </p>
  ${transactionalCtaButton("{{ .ConfirmationURL }}", "Redefinir senha")}
  ${transactionalFallbackLink("{{ .ConfirmationURL }}")}
  ${transactionalFooter("Se você não pediu esta alteração, ignore este e-mail. Sua senha atual continua válida.")}
`);
