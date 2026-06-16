"use client";

import { CheckCircle2, ImagePlus, Loader2, Upload, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { confirmUpload, requestUploadUrl } from "@/lib/gallery/actions";
import { triggerPhotoPregenerate } from "@/lib/gallery/image-variants";
import { cn } from "@/lib/utils";
import type { GalleryPhoto, UploadTicket } from "@/types/gallery";

interface Props {
  galleryId: string;
  folderId: string | null;
  onComplete: (photos: GalleryPhoto[]) => void;
  variant?: "inline" | "compact";
  onClose?: () => void;
}

interface FileItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  photo?: GalleryPhoto;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 50 * 1024 * 1024;

export function UploadDropzone({
  galleryId,
  folderId,
  onComplete,
  variant = "inline",
  onClose,
}: Props) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: File[]) {
    const valid = files.filter(
      (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_BYTES
    );
    const invalid = files.filter(
      (f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_BYTES
    );
    const newItems: FileItem[] = [
      ...valid.map((file) => ({
        file,
        id: crypto.randomUUID(),
        status: "pending" as const,
        progress: 0,
      })),
      ...invalid.map((file) => ({
        file,
        id: crypto.randomUUID(),
        status: "error" as const,
        progress: 0,
        error: !ALLOWED_TYPES.includes(file.type)
          ? "Somente JPEG e PNG"
          : "Acima de 50 MB",
      })),
    ];
    setItems((prev) => [...prev, ...newItems]);
    if (valid.length > 0 && variant === "inline") {
      const toUpload = newItems.filter((i) => i.status === "pending");
      void uploadAll(toUpload);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function uploadFile(item: FileItem): Promise<GalleryPhoto | null> {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const base = exists ? prev : [...prev, item];
      return base.map((i) =>
        i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i
      );
    });

    const ticketRes = await requestUploadUrl(
      galleryId,
      item.file.name,
      item.file.type,
      item.file.size
    );

    if (!ticketRes.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: ticketRes.error } : i
        )
      );
      return null;
    }

    const ticket: UploadTicket = ticketRes.ticket;

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95);
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i))
            );
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`HTTP ${xhr.status}`));
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Falha no envio ao storage (rede ou CORS)"))
        );
        xhr.open("PUT", ticket.presignedUrl);
        xhr.setRequestHeader("Content-Type", item.file.type);
        xhr.send(item.file);
      });
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "error", error: err instanceof Error ? err.message : "Erro de rede" }
            : i
        )
      );
      return null;
    }

    const confirmRes = await confirmUpload(galleryId, ticket, item.file.name, folderId);

    if (!confirmRes.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: confirmRes.error } : i
        )
      );
      return null;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: "done", progress: 100, photo: confirmRes.photo }
          : i
      )
    );
    triggerPhotoPregenerate(confirmRes.photo.id);
    return confirmRes.photo;
  }

  async function uploadAll(toUpload?: FileItem[]) {
    const pending = toUpload ?? items.filter((i) => i.status === "pending");
    if (!pending.length) return;
    setRunning(true);
    const photos: GalleryPhoto[] = [];
    for (const item of pending) {
      const photo = await uploadFile(item);
      if (photo) photos.push(photo);
    }
    setRunning(false);
    if (photos.length > 0) {
      onComplete(photos);
      if (variant === "compact") {
        setItems((prev) => prev.filter((i) => i.status !== "done"));
        onClose?.();
      }
    }
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const activeCount = pendingCount + uploadingCount;

  const isInline = variant === "inline";

  return (
    <div className={cn("flex flex-col", !isInline && "gap-4 rounded-ds-lg border border-ds-border bg-ds-surface p-5")}>
      {!isInline && onClose && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ds-ink">Subir fotos</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={running}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        onDragEnter={() => setDragging(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center transition-colors",
          isInline
            ? cn(
                "min-h-[280px] rounded-ds-card border-2 border-dashed px-6 py-16",
                dragging
                  ? "border-ds-accent/60 bg-ds-accent-soft/40"
                  : "border-ds-border bg-ds-cream/30 hover:border-ds-border-strong hover:bg-ds-cream/50"
              )
            : cn(
                "gap-3 rounded-ds-lg border-2 border-dashed py-10",
                dragging
                  ? "border-ds-accent bg-ds-accent/5"
                  : "border-ds-border bg-ds-cream/40 hover:border-ds-accent/50 hover:bg-ds-cream/60"
              )
        )}
      >
        {isInline ? (
          <ImagePlus className="mb-4 h-12 w-12 text-ds-muted/50" strokeWidth={1.25} />
        ) : (
          <Upload className="h-8 w-8 text-ds-muted" />
        )}
        <div className="text-center">
          <p className="text-sm text-ds-ink">
            Arraste fotos aqui para fazer o upload.{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-ds-ink underline underline-offset-2 hover:text-ds-accent"
            >
              Procurar arquivos
            </button>
          </p>
          <p className="mt-1 text-xs text-ds-muted">JPEG ou PNG · máx 50 MB cada</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={handleFileInput}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex max-h-48 flex-col gap-1.5 overflow-y-auto [scrollbar-width:thin]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-ds-md border border-ds-hairline bg-ds-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-ds-ink">{item.file.name}</p>
                {item.status === "uploading" && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ds-border">
                    <div
                      className="h-full bg-ds-accent transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.error && (
                  <p className="text-[10px] text-ds-danger">{item.error}</p>
                )}
              </div>

              {item.status === "pending" && !isInline && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 rounded p-0.5 text-ds-muted hover:text-ds-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {item.status === "uploading" && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ds-muted" />
              )}
              {item.status === "done" && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-ds-success" />
              )}
              {item.status === "error" && (
                <XCircle className="h-4 w-4 shrink-0 text-ds-danger" />
              )}
            </div>
          ))}
        </div>
      )}

      {!isInline && items.length > 0 && (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            onClick={() => uploadAll()}
            disabled={pendingCount === 0 || running}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Enviar {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
        </div>
      )}

      {isInline && activeCount > 0 && (
        <p className="mt-2 text-center text-xs text-ds-muted">
          Enviando {activeCount} {activeCount === 1 ? "arquivo" : "arquivos"}…
        </p>
      )}
    </div>
  );
}
