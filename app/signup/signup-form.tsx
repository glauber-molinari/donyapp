"use client";

import Link from "next/link";
import { useState } from "react";

import { inviteTokenFromNext, normalizeNextPath } from "@/lib/auth/next-path";
import { AUTH_STRENGTH_HINT, validatePassword, validatePasswordMatch } from "@/lib/auth/password-validation";
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
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function signInWithGoogle() {
    setLoading("google");
    setError(null);
    const supabase = createClient();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`,
      },
    });
    if (err) {
      setError("Não foi possível iniciar o login com Google.");
      setLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    const matchErr = validatePasswordMatch(password, confirm);
    if (matchErr) { setError(matchErr); return; }

    setLoading("email");
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
    setLoading(null);
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
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={loading !== null}
        className={btnPrimaryCls}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading === "google" ? "Redirecionando..." : "Entrar com Google"}
      </button>
      <p className="text-center text-xs leading-relaxed text-ds-muted-2">
        Usamos nome, e-mail e foto da Conta Google para criar a conta, autenticar e mostrar seu perfil à equipe.
      </p>

      {error ? (
        <p className="text-sm text-ds-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-ds-border" />
        <span className="text-xs text-ds-muted-2">ou</span>
        <div className="h-px flex-1 bg-ds-border" />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          disabled={loading !== null}
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
          disabled={loading !== null}
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
            disabled={loading !== null}
            autoComplete="new-password"
            className={inputCls}
          />
          <p className="px-1 text-xs text-ds-muted-2">{AUTH_STRENGTH_HINT}</p>
        </div>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmar senha"
          required
          disabled={loading !== null}
          autoComplete="new-password"
          className={inputCls}
        />
        <button type="submit" disabled={loading !== null} className={btnPrimaryCls}>
          {loading === "email" ? "Criando conta..." : "Criar conta"}
        </button>
        <p className="text-center text-xs text-ds-muted-2">
          Já tem conta?{" "}
          <Link href={loginHref} className="font-medium text-ds-accent hover:brightness-90">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
