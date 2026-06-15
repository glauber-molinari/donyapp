"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  slug: string;
  title: string;
}

export function PasswordGate({ slug, title }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${slug}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Senha incorreta");
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] p-8">
      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-white/60">
            Esta galeria é protegida por senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/30"
          />
          {error && (
            <p className="text-center text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-[#0c0a09] transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
