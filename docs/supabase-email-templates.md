# E-mails de autenticação (Supabase)

O convite de equipe é enviado pelo app via **Resend** (`lib/email/invite-email-html.ts`).

A confirmação de cadastro, recuperação de senha e magic link vêm do **Supabase Auth**. O visual é configurado no painel do Supabase, não no código Next.js.

## Passo a passo — confirmação de cadastro

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → projeto **Donyapp**.
2. **Authentication** → **Email Templates**.
3. Selecione **Confirm signup**.
4. **Subject:** cole o valor de `SUPABASE_CONFIRM_SIGNUP_SUBJECT` em `lib/email/supabase-auth-email-templates.ts`  
   (`Confirme seu cadastro no Dony.app`).
5. **Body:** abra o modo **Source** e cole **todo** o conteúdo de `docs/supabase-confirm-signup-body.html`.
   - Cole **somente HTML** — não cole o arquivo `.ts` (sem `export const`, sem `` ` ``, sem `${...}`).
   - Mantenha `{{ .ConfirmationURL }}` e `{{ .Email }}` exatamente assim.
6. Salve e use **Preview** no painel para conferir o layout.

Repita para **Reset password** com `SUPABASE_RESET_PASSWORD_*` se quiser o mesmo layout na recuperação de senha.

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
