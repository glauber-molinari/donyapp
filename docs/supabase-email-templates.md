# E-mails de autenticação (Supabase)

O convite de equipe é enviado pelo app via **Resend** (`lib/email/invite-email-html.ts`).

A confirmação de cadastro, recuperação de senha e magic link vêm do **Supabase Auth**. O visual é configurado no painel do Supabase, não no código Next.js.

## Passo a passo — confirmação de cadastro

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → projeto **Dony.app**.
2. **Authentication** → **Email Templates**.
3. Selecione **Confirm signup**.
4. **Subject:** cole o valor de `SUPABASE_CONFIRM_SIGNUP_SUBJECT` em `lib/email/supabase-auth-email-templates.ts`  
   (`Confirme seu cadastro no Dony.app`).
5. **Body:** abra o modo **Source** e cole o HTML abaixo (somente o HTML, sem Markdown).
   - Não cole o arquivo `.ts` (sem `export const`, sem `` ` ``, sem `${...}`).
   - Mantenha `{{ .ConfirmationURL }}` e `{{ .Email }}` exatamente assim — o Supabase preenche essas URLs, não o usuário.
6. Salve e use **Preview** no painel para conferir o layout.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f6f4ef;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" style="max-width:560px;width:100%;background:#fff;border-radius:12px;border:1px solid #e8e4dc;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#ea580c;letter-spacing:0.06em;text-transform:uppercase;">Dony.app</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">Confirme seu cadastro</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
            Você criou uma conta no Dony.app com o e-mail <strong>{{ .Email }}</strong>.
            Clique no botão abaixo para confirmar seu endereço e começar a usar o app.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#333333;">
            O Dony.app é uma plataforma de gestão de estúdio para fotógrafos e videomakers.
          </p>
          <p style="margin:0 0 24px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Confirmar e-mail</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#555555;">Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p style="margin:0 0 20px;font-size:13px;word-break:break-all;color:#333333;">{{ .ConfirmationURL }}</p>
          <p style="margin:0;font-size:12px;color:#666666;line-height:1.5;border-top:1px solid #e8e4dc;padding-top:16px;">Se você não criou esta conta, pode ignorar esta mensagem com segurança.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

Repita para **Reset password** com `SUPABASE_RESET_SUBJECT` / `SUPABASE_RESET_BODY_HTML` se quiser o mesmo layout na recuperação de senha.

## SMTP (remetente igual ao convite)

Para o remetente ser `noreply@donyapp.com` (como no Resend):

1. **Authentication** → **SMTP Settings** → ative **Custom SMTP**.
2. Use as credenciais do Resend (host `smtp.resend.com`, porta `465` ou `587`, usuário `resend`, senha = API key).
3. **Sender email / name:** `noreply@donyapp.com` / **`Dony.app`** (com ponto — igual ao Resend).

## Redirect URLs

Em **Authentication** → **URL Configuration**, mantenha na lista:

- `https://donyapp.com/auth/callback`
- `https://donyapp.com/auth/callback?next=**` (wildcard, se disponível)

## Variáveis do template

O Supabase usa sintaxe Go. Não altere `{{ .ConfirmationURL }}` nem `{{ .Email }}` — o Auth substitui na hora do envio.

Referência: https://supabase.com/docs/guides/auth/auth-email-templates
