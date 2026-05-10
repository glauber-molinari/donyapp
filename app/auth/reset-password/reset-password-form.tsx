"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PASSWORD_HINT, validatePassword, validatePasswordMatch } from "@/lib/auth/password-validation";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-ds-xl border border-app-border bg-app-canvas px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:ring-offset-1 focus:ring-offset-app-sidebar disabled:opacity-60";

const btnPrimaryCls =
  "flex w-full items-center justify-center rounded-ds-xl bg-app-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-app-primary/40 focus:ring-offset-2 focus:ring-offset-app-canvas disabled:opacity-60";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    const matchErr = validatePasswordMatch(password, confirm);
    if (matchErr) { setError(matchErr); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha"
          required
          disabled={loading}
          autoComplete="new-password"
          className={inputCls}
        />
        <p className="px-1 text-xs text-ds-subtle">{PASSWORD_HINT}</p>
      </div>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirmar nova senha"
        required
        disabled={loading}
        autoComplete="new-password"
        className={inputCls}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}
