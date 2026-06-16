"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { allowNewSelection } from "@/lib/gallery/actions";
import { MANAGE_COVER_WIDTH, galleryImageUrl } from "@/lib/gallery/image-variants";
import type { GalleryPhoto, GallerySelection } from "@/types/gallery";

interface Props {
  selection: GallerySelection;
  photos: GalleryPhoto[];
  galleryId: string;
}

export function ClientSelectionView({ selection, photos, galleryId }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = photos.filter((p) =>
    selection.selected_photo_ids.includes(p.id)
  );

  function handleAllowNewSelection() {
    startTransition(async () => {
      const res = await allowNewSelection(galleryId);
      setConfirmOpen(false);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Permitir nova seleção
        </Button>
      </div>

      {selection.client_note && (
        <div className="flex gap-2 rounded-ds-md bg-ds-cream px-3 py-2">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-muted" />
          <p className="text-sm text-ds-ink">{selection.client_note}</p>
        </div>
      )}

      {selected.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {selected.map((photo) => (
            <div key={photo.id} className="flex flex-col gap-1">
              <div className="aspect-square overflow-hidden rounded-ds-md border border-ds-border bg-ds-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImageUrl(photo.id, { w: MANAGE_COVER_WIDTH, ctx: "manage" })}
                  alt={photo.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p
                className="truncate text-[11px] text-ds-muted"
                title={photo.filename}
              >
                {photo.filename}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ds-muted">
          IDs de fotos na seleção não encontrados na galeria atual.
        </p>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Permitir nova seleção?"
        description="O cliente vai poder escolher fotos de novo ao abrir o link da galeria. Esta seleção deixa de aparecer aqui até ele enviar uma nova."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAllowNewSelection} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Permitir
            </Button>
          </>
        }
      />
    </Card>
  );
}
