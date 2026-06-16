"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle } from "lucide-react";

import type { GalleryPhoto, GallerySelection } from "@/types/gallery";

interface Props {
  selection: GallerySelection;
  photos: GalleryPhoto[];
  galleryId: string;
}

export function ClientSelectionView({ selection, photos }: Props) {
  const selected = photos.filter((p) =>
    selection.selected_photo_ids.includes(p.id)
  );

  return (
    <div className="flex flex-col gap-4 rounded-ds-lg border border-ds-success/30 bg-ds-success-soft/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ds-ink">
            Seleção do cliente — {selected.length}{" "}
            {selected.length === 1 ? "foto" : "fotos"}
          </p>
          <p className="text-xs text-ds-muted">
            Enviada{" "}
            {formatDistanceToNow(new Date(selection.submitted_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      {selection.client_note && (
        <div className="flex gap-2 rounded-ds-md bg-white/60 px-3 py-2">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-muted" />
          <p className="text-sm text-ds-ink">{selection.client_note}</p>
        </div>
      )}

      {selected.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {selected.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square overflow-hidden rounded-ds-md bg-ds-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/gallery/image/${photo.id}?w=240&ctx=manage`}
                alt={photo.filename}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ds-muted">
          IDs de fotos na seleção não encontrados na galeria atual.
        </p>
      )}
    </div>
  );
}
