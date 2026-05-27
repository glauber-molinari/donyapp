"use client";

import Link from "next/link";
import { useState } from "react";

import { inviteTokenFromNext, normalizeNextPath } from "@/lib/auth/next-path";
import { PASSWORD_HINT, validatePassword, validatePasswordMatch } from "@/lib/auth/password-validation";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-ds-xl border border-ds-border bg-ds-cream px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/30 focus:ring-offset-1 focus:ring-offset-ds-surface disabled:opacity-60";

const btnPrimaryCls =
  "flex w-full items-center justify-center gap-2 rounded-ds-xl bg-ds-accent px-4 py-3 text-sm font-semibold text-white shadow-ds-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ds-accent/40 focus:ring-offset-2 focus:ring-offset-ds-cream disabled:opacity-60";

export function SignupForm({ next = "/dashboard" }: { next?: string }) {
  const safeNext = normalizeNextPath(next);
  const inviteToken = inviteTokenFromNext(safeNext);
  const loginHref =
    safeNext === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(safeNext)}`;
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
        data: {
          name: name.trim() || email.split("@")[0],
          ...(inviteToken ? { invite_token: inviteToken } : {}),
        },
        emailRedirectTo: `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`,
      },
    });

    // Sempre mostrar a mesma tela — nunca indicar se o email já existe (anti-enumeration).
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-ds-xl border border-ds-success/25 bg-ds-success-soft px-4 py-4 text-sm text-ds-success">
          <p className="font-semibold">Verifique seu email</p>
          <p className="mt-1 text-xs text-ds-success">
            Se este endereço ainda não tem cadastro, você receberá um link de confirmação em
            instantes.
          </p>
        </div>
        <Link href={loginHref} className="text-sm text-ds-muted transition hover:text-ds-ink">
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
        <p className="px-1 text-xs text-ds-muted-2">{PASSWORD_HINT}</p>
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
        <p className="text-sm text-ds-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-xs text-ds-muted-2">
        Já tem conta?{" "}
        <Link href={loginHref} className="font-medium text-ds-accent hover:brightness-90">
          Entrar
        </Link>
      </p>
    </form>
  );
}
