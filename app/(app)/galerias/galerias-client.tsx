"use client";

import { Clock, Images, Lock, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { GalleryWithCounts } from "@/types/gallery";

interface Props {
  galleries: GalleryWithCounts[];
}

const STATUS_LABELS: Record<string, string> = {
  published: "Publicada",
  draft: "Rascunho",
};

const MODE_LABELS: Record<string, string> = {
  selection: "Seleção",
  delivery: "Entrega",
};

export function GaleriasClient({ galleries }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const filtered = galleries.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">Coleções</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2" />
            <input
              type="search"
              placeholder="Procurar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-ds-lg border border-ds-border bg-ds-surface py-2 pl-9 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
            />
          </div>
          <Link
            href="/galerias/nova"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-ds-lg bg-ds-accent px-4 text-sm font-medium text-white transition-colors duration-ds-fast hover:bg-[#e94c00]"
          >
            <Plus className="h-4 w-4" />
            Nova coleção
          </Link>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {(["all", "published", "draft"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-ds-pill px-3.5 py-1.5 text-xs font-medium transition-colors duration-ds-fast",
              statusFilter === s
                ? "bg-ds-ink text-ds-on-dark"
                : "border border-ds-border bg-ds-surface text-ds-muted hover:bg-ds-cream"
            )}
          >
            {s === "all" ? "Todas" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-ds-card border border-dashed border-ds-border bg-ds-surface px-6 py-20 text-center">
          <Images className="mb-4 h-10 w-10 text-ds-muted-2" />
          <h3 className="text-base font-semibold text-ds-ink">
            {search || statusFilter !== "all"
              ? "Nenhuma coleção encontrada"
              : "Nenhuma coleção ainda"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-ds-muted">
            {search || statusFilter !== "all"
              ? "Tente outros filtros."
              : "Crie sua primeira coleção para compartilhar fotos com seus clientes."}
          </p>
          {!search && statusFilter === "all" && (
            <Link
              href="/galerias/nova"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-ds-lg bg-ds-accent px-4 text-sm font-medium text-white transition-colors duration-ds-fast hover:bg-[#e94c00]"
            >
              <Plus className="h-4 w-4" />
              Nova coleção
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryCard({ gallery }: { gallery: GalleryWithCounts }) {
  const isPublished = gallery.status === "published";
  const isExpired = gallery.expires_at ? new Date(gallery.expires_at) < new Date() : false;
  const previews = gallery.preview_photo_ids;

  return (
    <Link href={`/galerias/${gallery.id}`} className="group flex flex-col gap-3">
      {/* Mosaico 2x2 */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-ds-card bg-ds-cream/60 shadow-ds-sm transition-shadow duration-ds-fast group-hover:shadow-ds-md">
        {previews.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Images className="h-10 w-10 text-ds-muted/30" />
          </div>
        ) : previews.length === 1 ? (
          <PreviewImg id={previews[0]} className="h-full w-full" />
        ) : (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden bg-ds-cream">
                {previews[i] ? (
                  <PreviewImg id={previews[i]} className="h-full w-full" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {gallery.password_hash && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-ds-muted-2" />
          )}
          <h3 className="truncate text-sm font-semibold text-ds-ink">{gallery.title}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ds-muted">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isExpired
                  ? "bg-ds-muted-2"
                  : isPublished
                  ? "bg-ds-success"
                  : "bg-ds-muted-2/50"
              )}
            />
            {isExpired ? "Expirada" : STATUS_LABELS[gallery.status]}
          </span>
          <span className="text-ds-muted-2">·</span>
          <span>
            {gallery.photo_count} {gallery.photo_count === 1 ? "foto" : "fotos"}
          </span>
          <span className="rounded-ds-sm bg-ds-cream px-1.5 py-0.5 text-[10px] font-medium text-ds-muted-2">
            {MODE_LABELS[gallery.mode]}
          </span>
        </div>

        {gallery.expires_at && !isExpired && (
          <div className="flex items-center gap-1 text-[11px] text-ds-muted-2">
            <Clock className="h-3 w-3" />
            Expira {new Date(gallery.expires_at).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>
    </Link>
  );
}

function PreviewImg({ id, className }: { id: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/gallery/image/${id}?w=300&ctx=manage`}
      alt=""
      loading="lazy"
      className={cn(
        "object-cover transition-transform duration-ds-fast group-hover:scale-[1.02]",
        className
      )}
    />
  );
}
