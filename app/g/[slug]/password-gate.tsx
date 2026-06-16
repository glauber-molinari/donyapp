"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  title: string;
  coverPhotoId?: string | null;
}

export function PasswordGate({ slug, title, coverPhotoId }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasCover = Boolean(coverPhotoId);

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-8">
      {/* Cover background */}
      {hasCover && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/gallery/image/${coverPhotoId}?w=1600&cover=1`}
            alt=""
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-[360px] text-center">
        <div
          className={cn(
            "mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full",
            hasCover ? "bg-white/15 backdrop-blur-sm" : "bg-stone-100"
          )}
        >
          <Lock className={cn("h-6 w-6", hasCover ? "text-white" : "text-stone-500")} />
        </div>
        <h1
          className={cn(
            "font-serif text-2xl font-light tracking-wide drop-shadow-sm sm:text-3xl",
            hasCover ? "text-white" : "text-stone-800"
          )}
        >
          {title}
        </h1>
        <p className={cn("mt-2 text-sm", hasCover ? "text-white/75" : "text-stone-400")}>
          Esta galeria é protegida por senha.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            className={cn(
              "w-full border px-4 py-3 text-center text-sm focus:outline-none",
              hasCover
                ? "border-white/30 bg-white/15 text-white backdrop-blur-sm placeholder:text-white/60 focus:border-white/60"
                : "border-stone-200 bg-white text-stone-700 placeholder:text-stone-300 focus:border-stone-400"
            )}
          />
          {error && (
            <p className={cn("text-xs", hasCover ? "text-rose-300" : "text-rose-500")}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-widest transition-opacity disabled:opacity-50",
              hasCover
                ? "bg-white text-stone-900 hover:opacity-90"
                : "bg-stone-900 text-white hover:opacity-90"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
