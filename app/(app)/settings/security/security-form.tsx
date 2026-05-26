"use client";

import { useState } from "react";

import { PASSWORD_HINT, validatePassword, validatePasswordMatch } from "@/lib/auth/password-validation";
import { createClient } from "@/lib/supabase/client";

import { changeEmail } from "./security-actions";

const inputCls =
  "w-full rounded-ds-xl border border-ds-border bg-ds-cream px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/30 focus:ring-offset-1 focus:ring-offset-ds-surface disabled:opacity-60";

const btnCls =
  "rounded-ds-xl bg-ds-accent px-4 py-2 text-sm font-semibold text-white shadow-ds-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ds-accent/40 focus:ring-offset-2 disabled:opacity-60";

interface Props {
  hasEmailProvider: boolean;
  currentEmail: string;
}

type PwdStep = "idle" | "otp" | "done";

export function SecurityForm({ hasEmailProvider, currentEmail }: Props) {
  // --- Email ---
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // --- Senha (fluxo: idle → otp → done) ---
  const [pwdStep, setPwdStep] = useState<PwdStep>("idle");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Passo 1: valida a nova senha e dispara a reautenticação por OTP no email.
  async function requestPasswordOtp(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);

    const pwdErr = validatePassword(newPassword);
    if (pwdErr) { setPwdError(pwdErr); return; }
    const matchErr = validatePasswordMatch(newPassword, confirmPassword);
    if (matchErr) { setPwdError(matchErr); return; }

    setPwdLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      setPwdError("Não foi possível enviar o código. Tente novamente.");
      setPwdLoading(false);
      return;
    }
    setPwdStep("otp");
    setPwdLoading(false);
  }

  // Passo 2: confirma com o OTP recebido e aplica a nova senha.
  async function confirmPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      nonce: otpCode,
    });
    if (error) {
      setPwdError("Código inválido ou expirado. Solicite um novo código.");
      setPwdLoading(false);
      return;
    }
    setPwdStep("done");
    setPwdLoading(false);
  }

  function resetPasswordFlow() {
    setPwdStep("idle");
    setNewPassword("");
    setConfirmPassword("");
    setOtpCode("");
    setPwdError(null);
  }

  // --- Email submit ---
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailResult(null);
    setEmailLoading(true);
    const result = await changeEmail(newEmail);
    setEmailResult({ ok: result.ok, msg: result.ok ? result.message : result.error });
    if (result.ok) setNewEmail("");
    setEmailLoading(false);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Seção: Email */}
      <section className="flex flex-col gap-4 rounded-ds-xl border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
        <div>
          <h3 className="text-sm font-semibold text-ds-ink">Endereço de email</h3>
          <p className="mt-0.5 text-xs text-ds-muted">
            Email atual:{" "}
            <span className="font-medium text-ds-ink">{currentEmail || "—"}</span>
          </p>
          <p className="mt-1 text-xs text-ds-muted-2">
            Você receberá confirmações nos dois endereços antes da troca ser efetivada.
          </p>
        </div>
        <form onSubmit={(e) => void handleEmailSubmit(e)} className="flex flex-col gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Novo email"
            required
            disabled={emailLoading}
            autoComplete="email"
            className={inputCls}
          />
          {emailResult && (
            <p
              className={`text-sm ${emailResult.ok ? "text-ds-success" : "text-ds-danger"}`}
              role="alert"
            >
              {emailResult.msg}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={emailLoading} className={btnCls}>
              {emailLoading ? "Enviando..." : "Solicitar troca"}
            </button>
          </div>
        </form>
      </section>

      {/* Seção: Senha */}
      <section className="flex flex-col gap-4 rounded-ds-xl border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
        <div>
          <h3 className="text-sm font-semibold text-ds-ink">Senha</h3>
          {hasEmailProvider ? (
            <p className="mt-0.5 text-xs text-ds-muted">
              Um código de verificação será enviado ao seu email para confirmar a troca.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-ds-muted">
              Sua conta usa login pelo Google e não possui senha.
            </p>
          )}
        </div>

        {!hasEmailProvider && (
          <p className="text-sm text-ds-muted-2">
            Não é possível alterar a senha de contas vinculadas exclusivamente ao Google.
          </p>
        )}

        {hasEmailProvider && pwdStep === "done" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ds-success">Senha alterada com sucesso.</p>
            <div className="flex justify-end">
              <button type="button" onClick={resetPasswordFlow} className={btnCls}>
                Alterar novamente
              </button>
            </div>
          </div>
        )}

        {hasEmailProvider && pwdStep === "idle" && (
          <form onSubmit={(e) => void requestPasswordOtp(e)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                required
                disabled={pwdLoading}
                autoComplete="new-password"
                className={inputCls}
              />
              <p className="px-1 text-xs text-ds-muted-2">{PASSWORD_HINT}</p>
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              required
              disabled={pwdLoading}
              autoComplete="new-password"
              className={inputCls}
            />
            {pwdError && (
              <p className="text-sm text-ds-danger" role="alert">
                {pwdError}
              </p>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={pwdLoading} className={btnCls}>
                {pwdLoading ? "Enviando código..." : "Solicitar código de verificação"}
              </button>
            </div>
          </form>
        )}

        {hasEmailProvider && pwdStep === "otp" && (
          <form onSubmit={(e) => void confirmPasswordChange(e)} className="flex flex-col gap-3">
            <div className="rounded-ds-xl border border-ds-info/20 bg-ds-info-soft px-3 py-2.5 text-xs text-ds-info">
              Código enviado para <strong>{currentEmail}</strong>. Verifique sua caixa de entrada.
            </div>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Código de verificação"
              required
              disabled={pwdLoading}
              autoComplete="one-time-code"
              inputMode="numeric"
              className={inputCls}
            />
            {pwdError && (
              <p className="text-sm text-ds-danger" role="alert">
                {pwdError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetPasswordFlow}
                disabled={pwdLoading}
                className="text-xs text-ds-muted transition hover:text-ds-ink disabled:opacity-50"
              >
                Cancelar
              </button>
              <button type="submit" disabled={pwdLoading} className={btnCls}>
                {pwdLoading ? "Confirmando..." : "Confirmar nova senha"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
