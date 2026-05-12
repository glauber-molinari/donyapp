"use client";

import Link from "next/link";
import { useState } from "react";

import { PASSWORD_HINT, validatePassword, validatePasswordMatch } from "@/lib/auth/password-validation";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-ds-xl border border-app-border bg-app-canvas px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:ring-offset-1 focus:ring-offset-app-sidebar disabled:opacity-60";

const btnPrimaryCls =
  "flex w-full items-center justify-center gap-2 rounded-ds-xl bg-app-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-app-primary/40 focus:ring-offset-2 focus:ring-offset-app-canvas disabled:opacity-60";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    const matchErr = validatePasswordMatch(password, confirm);
    if (matchErr) { setError(matchErr); return; }

    setLoading(true);
    const supabase = createClient();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "");

    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split("@")[0] },
        emailRedirectTo: `${base}/auth/callback`,
      },
    });

    // Sempre mostrar a mesma tela — nunca indicar se o email já existe (anti-enumeration).
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-ds-xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-green-800">
          <p className="font-semibold">Verifique seu email</p>
          <p className="mt-1 text-xs text-green-700">
            Se este endereço ainda não tem cadastro, você receberá um link de confirmação em
            instantes.
          </p>
        </div>
        <Link href="/login" className="text-sm text-ds-muted transition hover:text-ds-ink">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        disabled={loading}
        autoComplete="name"
        className={inputCls}
      />
      <input
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        disabled={loading}
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        className={inputCls}
      />
      <div className="flex flex-col gap-1">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
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
        placeholder="Confirmar senha"
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
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-xs text-ds-subtle">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-app-primary hover:brightness-90">
          Entrar
        </Link>
      </p>
    </form>
  );
}
