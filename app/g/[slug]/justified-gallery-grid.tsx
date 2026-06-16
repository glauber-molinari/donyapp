"use client";

import { Download, Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  GRID_DEFAULT_WIDTH,
  GRID_IMAGE_SIZES,
  GRID_WIDTHS,
  galleryImageSrcSet,
  galleryImageUrl,
} from "@/lib/gallery/image-variants";
import {
  buildJustifiedRows,
  itemWidth,
  justifiedTargetRowHeight,
} from "@/lib/gallery/justified-layout";
import { cn } from "@/lib/utils";
import type { PublicGalleryData } from "@/types/gallery";

type GalleryPhoto = PublicGalleryData["photos"][number];

const GAP_PX = 6;
const DEFAULT_ASPECT = 1.5;

interface Props {
  photos: GalleryPhoto[];
  slug: string;
  useWatermark: boolean;
  isSelection: boolean;
  isDelivery: boolean;
  downloadEnabled: boolean;
  favoriteEnabled: boolean;
  submitted: boolean;
  favorites: Set<string>;
  onOpenLightbox: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function JustifiedGalleryGrid({
  photos,
  slug,
  useWatermark,
  isSelection,
  isDelivery,
  downloadEnabled,
  favoriteEnabled,
  submitted,
  favorites,
  onOpenLightbox,
  onToggleFavorite,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.clientWidth);
    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const targetHeight = justifiedTargetRowHeight(containerWidth);

  const rows = useMemo(() => {
    if (containerWidth <= 0) return [];
    const items = photos.map((photo) => ({
      id: photo.id,
      aspectRatio: aspectRatios[photo.id] ?? DEFAULT_ASPECT,
    }));
    return buildJustifiedRows(items, containerWidth, targetHeight, GAP_PX);
  }, [photos, aspectRatios, containerWidth, targetHeight]);

  function handleImageLoad(photoId: string, img: HTMLImageElement) {
    const { naturalWidth, naturalHeight } = img;
    if (!naturalWidth || !naturalHeight) return;
    const aspectRatio = naturalWidth / naturalHeight;
    setAspectRatios((prev) => {
      if (prev[photoId] === aspectRatio) return prev;
      return { ...prev, [photoId]: aspectRatio };
    });
  }

  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  return (
    <div ref={containerRef} className="flex flex-col" style={{ gap: GAP_PX }}>
      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex"
          style={{ gap: GAP_PX, height: row.height }}
        >
          {row.items.map((item) => {
            const photo = photoById.get(item.id);
            if (!photo) return null;

            const isFav = favorites.has(photo.id);
            const width = itemWidth(row.height, item.aspectRatio);

            return (
              <div
                key={photo.id}
                className="group relative shrink-0 overflow-hidden"
                style={{ width, height: row.height }}
              >
                <button
                  type="button"
                  onClick={() => onOpenLightbox(photo.id)}
                  className="block h-full w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galleryImageUrl(photo.id, { w: GRID_DEFAULT_WIDTH, wm: useWatermark })}
                    srcSet={galleryImageSrcSet(photo.id, GRID_WIDTHS, { wm: useWatermark })}
                    sizes={GRID_IMAGE_SIZES}
                    alt={photo.filename}
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => handleImageLoad(photo.id, e.currentTarget)}
                    className={cn(
                      "h-full w-full bg-stone-100 object-cover transition-opacity duration-300 group-hover:opacity-95",
                      isSelection && isFav && "ring-2 ring-stone-900 ring-offset-0"
                    )}
                  />
                </button>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {isSelection && favoriteEnabled && !submitted && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(photo.id)}
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

                {isDelivery && downloadEnabled && (
                  <a
                    href={`/api/gallery/${slug}/download/${photo.id}`}
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
      ))}
    </div>
  );
}
