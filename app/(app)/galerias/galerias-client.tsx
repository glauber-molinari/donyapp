"use client";

import {
  CheckCircle2,
  Clock,
  Images,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-ink">Galerias</h1>
          <p className="mt-0.5 text-sm text-ds-muted">
            Entregue e compartilhe fotos com seus clientes
          </p>
        </div>
        <Link
          href="/galerias/nova"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-ds-lg bg-ds-accent px-4 text-sm font-medium text-white transition-colors duration-ds-fast hover:bg-[#e94c00]"
        >
          <Plus className="h-4 w-4" />
          Nova galeria
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
          <input
            type="search"
            placeholder="Buscar galeria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-ds-lg border border-ds-border bg-ds-surface py-2 pl-9 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-ds-pill px-3 py-1.5 text-xs font-medium transition-colors duration-ds-fast",
                statusFilter === s
                  ? "bg-ds-ink text-ds-on-dark"
                  : "border border-ds-border bg-ds-surface text-ds-muted hover:bg-ds-cream"
              )}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Images}
          title={search || statusFilter !== "all" ? "Nenhuma galeria encontrada" : "Nenhuma galeria ainda"}
          description={
            search || statusFilter !== "all"
              ? "Tente outros filtros."
              : "Crie sua primeira galeria para compartilhar fotos com seus clientes."
          }
        >
          {!search && statusFilter === "all" && (
            <Link
              href="/galerias/nova"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-ds-lg bg-ds-accent px-4 text-sm font-medium text-white transition-colors duration-ds-fast hover:bg-[#e94c00]"
            >
              <Plus className="h-4 w-4" />
              Nova galeria
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  const isExpired =
    gallery.expires_at ? new Date(gallery.expires_at) < new Date() : false;

  return (
    <Link
      href={`/galerias/${gallery.id}`}
      className="group flex flex-col overflow-hidden rounded-ds-card border border-ds-border bg-ds-surface shadow-ds-sm transition-shadow duration-ds-fast hover:shadow-ds-md"
    >
      <div className="relative flex h-40 items-center justify-center bg-ds-cream/60">
        {gallery.cover_photo_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/gallery/image/${gallery.cover_photo_id}?w=480`}
            alt=""
            className="h-full w-full object-cover transition-transform duration-ds-fast group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <Images className="h-10 w-10 text-ds-muted/40" />
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-ds-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            isExpired
              ? "bg-ds-muted/20 text-ds-muted"
              : isPublished
              ? "bg-ds-success-soft text-ds-success"
              : "bg-ds-surface/90 text-ds-muted"
          )}
        >
          {isExpired ? "Expirada" : STATUS_LABELS[gallery.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-sm font-semibold leading-snug text-ds-ink line-clamp-2">
          {gallery.title}
        </p>

        <div className="flex items-center gap-3 text-xs text-ds-muted">
          <span className="flex items-center gap-1">
            <Images className="h-3 w-3" />
            {gallery.photo_count} {gallery.photo_count === 1 ? "foto" : "fotos"}
          </span>
          <span className="rounded-ds-md bg-ds-cream px-1.5 py-0.5 text-[10px] font-medium text-ds-muted">
            {MODE_LABELS[gallery.mode]}
          </span>
        </div>

        {gallery.has_selection && (
          <div className="flex items-center gap-1 rounded-ds-md bg-ds-success-soft px-2 py-1 text-xs text-ds-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Seleção recebida
          </div>
        )}

        {gallery.expires_at && (
          <div className="mt-auto flex items-center gap-1 text-[11px] text-ds-muted">
            <Clock className="h-3 w-3" />
            Expira {new Date(gallery.expires_at).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>
    </Link>
  );
}
