"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Send,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { PublicGalleryData } from "@/types/gallery";

interface Props {
  gallery: PublicGalleryData;
}

export function GalleryPublicClient({ gallery }: Props) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);

  const isSelection = gallery.mode === "selection";
  const isDelivery = gallery.mode === "delivery";

  const visiblePhotos = activeFolderId
    ? gallery.photos.filter((p) => p.folder_id === activeFolderId)
    : gallery.photos;

  const lightboxIdx = lightboxId
    ? visiblePhotos.findIndex((p) => p.id === lightboxId)
    : -1;

  function navigateLightbox(dir: 1 | -1) {
    const next = visiblePhotos[lightboxIdx + dir];
    if (next) setLightboxId(next.id);
  }

  useEffect(() => {
    if (!lightboxId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "Escape") setLightboxId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxId, lightboxIdx]);

  function toggleFavorite(photoId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  async function handleSubmitSelection() {
    if (favorites.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gallery/${gallery.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_photo_ids: Array.from(favorites),
          client_note: note.trim() || undefined,
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  const coverPhoto = gallery.cover_photo_id
    ? gallery.photos.find((p) => p.id === gallery.cover_photo_id)
    : gallery.photos[0];

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white">
      {/* Hero landing */}
      <div className="relative flex h-[50vh] min-h-[320px] flex-col items-center justify-center overflow-hidden">
        {coverPhoto && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/gallery/image/${coverPhoto.id}?w=1200`}
              alt="Capa"
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0a09]" />
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
          {gallery.studio_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gallery.studio_logo_url}
              alt={gallery.studio_name}
              className="mb-2 h-12 w-auto object-contain opacity-90"
            />
          )}
          <h1 className="text-2xl font-bold sm:text-3xl">{gallery.title}</h1>
          {gallery.job_date && (
            <p className="text-sm text-white/60">
              {new Date(gallery.job_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <p className="text-xs text-white/40">{gallery.studio_name}</p>
          <p className="mt-1 text-sm text-white/60">
            {gallery.photos.length}{" "}
            {gallery.photos.length === 1 ? "foto" : "fotos"}
          </p>
        </div>
      </div>

      {/* Mode banner */}
      {isSelection && !submitted && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#1a1614] px-4 py-3 sm:px-6">
          <p className="text-xs text-white/70">
            Selecione as fotos que você quer e clique em{" "}
            <strong className="text-white">Enviar seleção</strong>
            {favorites.size > 0 && ` (${favorites.size} escolhidas)`}.
          </p>
          <div className="flex shrink-0 gap-2">
            {favorites.size > 0 && (
              <button
                type="button"
                onClick={() => setShowSelectionPanel(true)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
              >
                Revisar ({favorites.size})
              </button>
            )}
            <button
              type="button"
              disabled={favorites.size === 0 || submitting}
              onClick={handleSubmitSelection}
              className="flex items-center gap-1.5 rounded-full bg-[#ff5500] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar seleção
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="flex items-center justify-center gap-2 bg-ds-success/20 px-4 py-3 text-sm font-medium text-white">
          ✅ Seleção enviada! O fotógrafo já foi notificado.
        </div>
      )}

      {/* Folder tabs */}
      {gallery.folders.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 sm:px-6 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className={cn(
              "shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              activeFolderId === null
                ? "border-b-2 border-[#ff5500] text-white"
                : "text-white/50 hover:text-white"
            )}
          >
            Todas
          </button>
          {gallery.folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFolderId(f.id)}
              className={cn(
                "shrink-0 px-4 py-3 text-sm font-medium transition-colors",
                activeFolderId === f.id
                  ? "border-b-2 border-[#ff5500] text-white"
                  : "text-white/50 hover:text-white"
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Download all */}
      {isDelivery && gallery.download_enabled && (
        <div className="flex justify-end px-4 pt-4 sm:px-6">
          <a
            href={`/api/gallery/${gallery.slug}/download-all`}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar tudo (.zip)
          </a>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-1 p-4 sm:grid-cols-3 sm:p-6 md:grid-cols-4 lg:grid-cols-5">
        {visiblePhotos.map((photo) => {
          const isFav = favorites.has(photo.id);
          return (
            <div key={photo.id} className="group relative aspect-square overflow-hidden">
              <button
                type="button"
                onClick={() => setLightboxId(photo.id)}
                className="h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/gallery/image/${photo.id}?w=480`}
                  alt={photo.filename}
                  loading="lazy"
                  className={cn(
                    "h-full w-full object-cover transition-all duration-200 group-hover:scale-105",
                    isSelection && isFav && "ring-2 ring-[#ff5500] ring-inset"
                  )}
                />
              </button>

              {/* Favorite button (selection mode) */}
              {isSelection && gallery.favorite_enabled && !submitted && (
                <button
                  type="button"
                  onClick={() => toggleFavorite(photo.id)}
                  className={cn(
                    "absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full transition-all",
                    isFav
                      ? "bg-[#ff5500] text-white"
                      : "bg-black/40 text-white/60 opacity-0 hover:opacity-100 group-hover:opacity-100"
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", isFav && "fill-white")} />
                </button>
              )}

              {/* Download button (delivery mode) */}
              {isDelivery && gallery.download_enabled && (
                <a
                  href={`/api/gallery/${gallery.slug}/download/${photo.id}`}
                  className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 opacity-0 transition-opacity group-hover:opacity-100"
                  title="Baixar"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/5 px-4 py-6 text-center sm:px-6">
        <p className="text-xs text-white/30">
          {gallery.studio_name} · Powered by{" "}
          <span className="text-white/50">Dony.app</span>
        </p>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={() => setLightboxId(null)}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxId(null)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Prev */}
            {lightboxIdx > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxId}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/gallery/image/${lightboxId}`}
                alt="Foto"
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              />
            </motion.div>

            {/* Next */}
            {lightboxIdx < visiblePhotos.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">
              {lightboxIdx + 1} / {visiblePhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection review panel */}
      <AnimatePresence>
        {showSelectionPanel && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[#1a1614] sm:w-[380px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-white">
                Minha seleção ({favorites.size})
              </h2>
              <button type="button" onClick={() => setShowSelectionPanel(false)} className="text-white/50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {gallery.photos
                  .filter((p) => favorites.has(p.id))
                  .map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/gallery/image/${photo.id}?w=240`}
                        alt={photo.filename}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(photo.id)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Deixe uma mensagem para o fotógrafo (opcional)"
                  className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                  rows={3}
                />
              </div>
            </div>
            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                disabled={favorites.size === 0 || submitting}
                onClick={async () => {
                  await handleSubmitSelection();
                  setShowSelectionPanel(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff5500] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Enviar {favorites.size} foto{favorites.size !== 1 ? "s" : ""}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
