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
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { PublicGalleryData } from "@/types/gallery";

interface Props {
  gallery: PublicGalleryData;
}

export function GalleryPublicClient({ gallery }: Props) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(gallery.existing_selection?.selected_photo_ids ?? [])
  );
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(Boolean(gallery.existing_selection));
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState(gallery.existing_selection?.client_note ?? "");
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

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

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const coverPhoto = gallery.cover_photo_id
    ? gallery.photos.find((p) => p.id === gallery.cover_photo_id)
    : gallery.photos[0];

  const eventDate = gallery.job_date
    ? new Date(gallery.job_date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-white text-stone-800">
      {/* ---------- HERO ---------- */}
      <section className="relative flex h-[100svh] min-h-[560px] w-full flex-col items-center justify-center overflow-hidden">
        {coverPhoto && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/gallery/image/${coverPhoto.id}?w=1600&cover=1`}
              alt={gallery.title}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center px-6 text-center text-white">
          <h1 className="font-serif text-4xl font-light leading-tight tracking-wide drop-shadow-sm sm:text-5xl lg:text-6xl">
            {gallery.title}
          </h1>
          {eventDate && (
            <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/85">
              {eventDate}
            </p>
          )}
          <button
            type="button"
            onClick={scrollToGrid}
            className="mt-9 border border-white/70 px-9 py-3 text-[11px] uppercase tracking-[0.25em] text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white hover:text-stone-900"
          >
            Ver galeria
          </button>
        </div>

        {/* Studio brand — bottom center */}
        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          {gallery.studio_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gallery.studio_logo_url}
              alt={gallery.studio_name}
              className="h-10 w-auto object-contain opacity-95 drop-shadow"
            />
          ) : null}
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/80">
            {gallery.studio_name}
          </span>
        </div>
      </section>

      {/* ---------- GRID HEADER ---------- */}
      <div ref={gridRef} className="scroll-mt-4 border-b border-stone-100 pt-8">
        {/* Folder tabs */}
        {gallery.folders.length > 0 && (
          <div className="flex justify-center gap-6 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FolderTab
              active={activeFolderId === null}
              onClick={() => setActiveFolderId(null)}
              label="Todas"
            />
            {gallery.folders.map((f) => (
              <FolderTab
                key={f.id}
                active={activeFolderId === f.id}
                onClick={() => setActiveFolderId(f.id)}
                label={f.name}
              />
            ))}
          </div>
        )}

        {/* Delivery: baixar tudo */}
        {isDelivery && gallery.download_enabled && (
          <div className="flex justify-center pb-6">
            <a
              href={`/api/gallery/${gallery.slug}/download-all`}
              className="flex items-center gap-2 border border-stone-300 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] text-stone-600 transition-colors hover:border-stone-800 hover:text-stone-900"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar tudo
            </a>
          </div>
        )}
      </div>

      {/* ---------- MASONRY GRID ---------- */}
      <div className="mx-auto max-w-[1600px] px-1.5 py-2 sm:px-3 sm:py-4">
        <div className="columns-2 gap-1.5 sm:columns-3 sm:gap-2 lg:columns-4 xl:columns-5">
          {visiblePhotos.map((photo) => {
            const isFav = favorites.has(photo.id);
            return (
              <div
                key={photo.id}
                className="group relative mb-1.5 break-inside-avoid overflow-hidden sm:mb-2"
              >
                <button
                  type="button"
                  onClick={() => setLightboxId(photo.id)}
                  className="block w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/gallery/image/${photo.id}?w=500&wm=1`}
                    alt={photo.filename}
                    loading="lazy"
                    className={cn(
                      "w-full bg-stone-100 transition-opacity duration-300 group-hover:opacity-95",
                      isSelection && isFav && "ring-2 ring-stone-900 ring-offset-0"
                    )}
                  />
                </button>

                {/* gradient on hover for icon legibility */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Favorite (selection mode) */}
                {isSelection && gallery.favorite_enabled && !submitted && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(photo.id)}
                    className={cn(
                      "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      isFav
                        ? "bg-white text-rose-500 shadow-md"
                        : "bg-black/30 text-white opacity-0 backdrop-blur-sm hover:bg-black/50 group-hover:opacity-100"
                    )}
                    aria-label={isFav ? "Remover dos favoritos" : "Favoritar"}
                  >
                    <Heart className={cn("h-4 w-4", isFav && "fill-rose-500")} />
                  </button>
                )}

                {/* Download (delivery mode) */}
                {isDelivery && gallery.download_enabled && (
                  <a
                    href={`/api/gallery/${gallery.slug}/download/${photo.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 group-hover:opacity-100"
                    title="Baixar foto"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-stone-100 px-4 py-10 text-center">
        {gallery.studio_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery.studio_logo_url}
            alt={gallery.studio_name}
            className="mx-auto mb-3 h-8 w-auto object-contain opacity-70"
          />
        ) : null}
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">
          {gallery.studio_name}
        </p>
        <p className="mt-4 text-[11px] text-stone-300">
          Criado com{" "}
          <span className="font-medium text-stone-400">Dony.app</span>
        </p>
      </footer>

      {/* ---------- SELECTION FLOATING BAR ---------- */}
      <AnimatePresence>
        {isSelection && !submitted && favorites.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5"
          >
            <div className="flex items-center gap-3 rounded-full bg-stone-900 py-2 pl-5 pr-2 text-white shadow-2xl">
              <span className="text-sm">
                <strong>{favorites.size}</strong>{" "}
                {favorites.size === 1 ? "foto escolhida" : "fotos escolhidas"}
              </span>
              <button
                type="button"
                onClick={() => setShowSelectionPanel(true)}
                className="text-xs text-white/60 underline-offset-2 hover:underline"
              >
                Revisar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitSelection}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-stone-900 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar seleção
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- SUBMITTED CONFIRMATION ---------- */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5"
          >
            <div className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-2xl">
              Seleção enviada — o fotógrafo já foi avisado. Obrigado!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- LIGHTBOX ---------- */}
      <AnimatePresence>
        {lightboxId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
            onClick={() => setLightboxId(null)}
          >
            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
              <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {lightboxIdx + 1} / {visiblePhotos.length}
              </span>
              <div className="flex items-center gap-1">
                {isSelection && gallery.favorite_enabled && !submitted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(lightboxId);
                    }}
                    className="rounded-full p-2 text-stone-500 transition-colors hover:text-rose-500"
                    aria-label="Favoritar"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        favorites.has(lightboxId) && "fill-rose-500 text-rose-500"
                      )}
                    />
                  </button>
                )}
                {isDelivery && gallery.download_enabled && (
                  <a
                    href={`/api/gallery/${gallery.slug}/download/${lightboxId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full p-2 text-stone-500 transition-colors hover:text-stone-900"
                    title="Baixar"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxId(null)}
                  className="rounded-full p-2 text-stone-500 transition-colors hover:text-stone-900"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Prev */}
            {lightboxIdx > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(-1);
                }}
                className="absolute left-3 z-10 rounded-full p-2 text-stone-400 transition-colors hover:text-stone-900 sm:left-6"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              className="flex max-h-[85vh] max-w-[88vw] flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/gallery/image/${lightboxId}?w=1400&wm=1&display=lightbox`}
                alt=""
                className="max-h-[78vh] max-w-[88vw] object-contain shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
              />
              <p className="mt-3 text-xs text-stone-400">
                {visiblePhotos[lightboxIdx]?.filename}
              </p>
            </motion.div>

            {/* Next */}
            {lightboxIdx < visiblePhotos.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(1);
                }}
                className="absolute right-3 z-10 rounded-full p-2 text-stone-400 transition-colors hover:text-stone-900 sm:right-6"
                aria-label="Próxima"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- SELECTION REVIEW PANEL ---------- */}
      <AnimatePresence>
        {showSelectionPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setShowSelectionPanel(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white sm:w-[400px]"
            >
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <h2 className="font-serif text-lg font-light text-stone-800">
                  Sua seleção ({favorites.size})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSelectionPanel(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-3 gap-2">
                  {gallery.photos
                    .filter((p) => favorites.has(p.id))
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square overflow-hidden bg-stone-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/gallery/image/${photo.id}?w=240&wm=1`}
                          alt={photo.filename}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => toggleFavorite(photo.id)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-stone-600 hover:text-rose-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>

                <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-stone-400">
                  Mensagem para o fotógrafo (opcional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: priorize as fotos do altar…"
                  rows={3}
                  className="mt-2 w-full border border-stone-200 px-3 py-2.5 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
                />
              </div>

              <div className="border-t border-stone-100 p-5">
                <button
                  type="button"
                  disabled={favorites.size === 0 || submitting}
                  onClick={async () => {
                    await handleSubmitSelection();
                    setShowSelectionPanel(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 bg-stone-900 py-3.5 text-xs font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Enviar {favorites.size} foto{favorites.size !== 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 border-b-2 pb-1 text-xs uppercase tracking-[0.2em] transition-colors",
        active
          ? "border-stone-800 text-stone-800"
          : "border-transparent text-stone-400 hover:text-stone-700"
      )}
    >
      {label}
    </button>
  );
}
