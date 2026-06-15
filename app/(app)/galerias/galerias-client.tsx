"use client";

import {
  CheckCircle2,
  Clock,
  Eye,
  Images,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { createGallery } from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";
import type { GalleryWithCounts } from "@/types/gallery";

interface Job {
  id: string;
  name: string;
}

interface Props {
  galleries: GalleryWithCounts[];
  jobs: Job[];
}

const STATUS_LABELS: Record<string, string> = {
  published: "Publicada",
  draft: "Rascunho",
};

const MODE_LABELS: Record<string, string> = {
  selection: "Seleção",
  delivery: "Entrega",
};

export function GaleriasClient({ galleries, jobs }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [galleryTitle, setGalleryTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = galleries.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job && !galleryTitle) setGalleryTitle(job.name);
  }

  function handleCreate() {
    if (!selectedJobId || !galleryTitle.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createGallery(selectedJobId, galleryTitle.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      setSelectedJobId("");
      setGalleryTitle("");
      router.push(`/galerias/${res.gallery.id}`);
    });
  }

  const jobsWithoutGallery = jobs.filter(
    (j) => !galleries.some((g) => g.job_id === j.id)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-ink">Galerias</h1>
          <p className="mt-0.5 text-sm text-ds-muted">
            Entregue e compartilhe fotos com seus clientes
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Galeria
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
          <input
            type="search"
            placeholder="Buscar galeria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-ds-lg border border-ds-border bg-ds-surface py-2 pl-9 pr-3 text-sm text-ds-ink placeholder:text-ds-muted focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-ds-pill px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-ds-accent text-white"
                  : "border border-ds-border bg-ds-surface text-ds-muted hover:bg-ds-cream"
              )}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
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
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Galeria
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}

      {/* Modal Nova Galeria */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError(null);
        }}
        title="Nova Galeria"
        description="Escolha o job e o nome da galeria."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedJobId || !galleryTitle.trim() || isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar Galeria
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-job" className="text-xs font-medium text-ds-ink">
              Job
            </label>
            <select
              id="gallery-job"
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full rounded-ds-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
            >
              <option value="">Selecione um job...</option>
              {jobsWithoutGallery.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
            {jobsWithoutGallery.length === 0 && (
              <p className="text-xs text-ds-muted">
                Todos os seus jobs já têm galeria.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gallery-title" className="text-xs font-medium text-ds-ink">
              Título da galeria
            </label>
            <input
              id="gallery-title"
              type="text"
              value={galleryTitle}
              onChange={(e) => setGalleryTitle(e.target.value)}
              placeholder="Ex: Ensaio Família Silva 2024"
              className="w-full rounded-ds-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink placeholder:text-ds-muted focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
            />
          </div>
          {error ? <p className="text-xs text-ds-danger">{error}</p> : null}
        </div>
      </Dialog>
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
      className="group flex flex-col overflow-hidden rounded-ds-card border border-ds-border bg-ds-surface shadow-ds-sm transition-shadow hover:shadow-ds-md"
    >
      {/* Capa */}
      <div className="flex h-36 items-center justify-center bg-ds-cream/60">
        <Images className="h-10 w-10 text-ds-muted/40" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-ds-ink line-clamp-2">
            {gallery.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isExpired
                ? "bg-ds-muted/10 text-ds-muted"
                : isPublished
                ? "bg-ds-success-soft text-ds-success"
                : "bg-ds-cream text-ds-muted"
            )}
          >
            {isExpired ? "Expirada" : STATUS_LABELS[gallery.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-ds-muted">
          <span className="flex items-center gap-1">
            <Images className="h-3 w-3" />
            {gallery.photo_count} {gallery.photo_count === 1 ? "foto" : "fotos"}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              gallery.mode === "selection"
                ? "bg-ds-info/10 text-ds-info"
                : "bg-ds-accent/10 text-ds-accent"
            )}
          >
            {MODE_LABELS[gallery.mode]}
          </span>
        </div>

        {gallery.has_selection && (
          <div className="flex items-center gap-1 rounded-ds-md bg-ds-success-soft px-2 py-1 text-xs text-ds-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Seleção recebida
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-[11px] text-ds-muted">
          {gallery.expires_at ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expira {new Date(gallery.expires_at).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-ds-accent opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="h-3 w-3" />
            Abrir
          </span>
        </div>
      </div>
    </Link>
  );
}
