"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-ds-xl border border-ds-border bg-ds-cream px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/30 focus:ring-offset-1 focus:ring-offset-ds-surface disabled:opacity-60";

const btnPrimaryCls =
  "flex w-full items-center justify-center rounded-ds-xl bg-ds-accent px-4 py-3 text-sm font-semibold text-white shadow-ds-sm transition duration-ds ease-out hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ds-accent/40 focus:ring-offset-2 focus:ring-offset-ds-cream disabled:opacity-60";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "");

    // Não verificar se o email existe — resposta idêntica para qualquer entrada (anti-enumeration).
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${base}/auth/callback`,
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-ds-xl border border-ds-success/25 bg-ds-success-soft px-4 py-4 text-sm text-ds-success">
          <p className="font-semibold">Verifique seu email</p>
          <p className="mt-1 text-xs text-ds-success">
            Se este endereço estiver cadastrado, você receberá um link para redefinir sua senha em
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
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email de cadastro"
        required
        disabled={loading}
        autoComplete="email"
        className={inputCls}
      />
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </button>
      <Link
        href="/login"
        className="text-center text-sm text-ds-muted transition hover:text-ds-ink"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
