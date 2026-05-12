"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-ds-xl border border-app-border bg-app-canvas px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-subtle focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:ring-offset-1 focus:ring-offset-app-sidebar disabled:opacity-60";

const btnPrimaryCls =
  "flex w-full items-center justify-center gap-2 rounded-ds-xl bg-app-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-app-primary/40 focus:ring-offset-2 focus:ring-offset-app-canvas disabled:opacity-60";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

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

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      setError("Email ou senha inválidos.");
      setLoading(null);
      return;
    }
    window.location.href = safeNext;
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

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-app-border" />
        <span className="text-xs text-ds-subtle">ou</span>
        <div className="h-px flex-1 bg-app-border" />
      </div>

      <form onSubmit={(e) => void signInWithEmail(e)} className="flex flex-col gap-3">
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
          disabled={loading !== null}
          autoComplete="current-password"
          className={inputCls}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading !== null} className={btnPrimaryCls}>
          {loading === "email" ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <Link
          href="/forgot-password"
          className="text-ds-muted transition hover:text-ds-ink"
        >
          Esqueci a senha
        </Link>
        <Link
          href="/signup"
          className="font-medium text-app-primary transition hover:brightness-90"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
