"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FolderPlus,
  Images,
  Loader2,
  Pencil,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DestructiveDialog } from "@/components/ui/dialog";
import {
  archiveGallery,
  createFolder,
  deleteGallery,
  deletePhoto,
  publishGallery,
  setGalleryMode,
} from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";
import type {
  Gallery,
  GalleryFolder,
  GalleryPhoto,
  GallerySelection,
} from "@/types/gallery";

import { ClientSelectionView } from "./client-selection-view";
import { GallerySettingsPanel } from "./gallery-settings-panel";
import { UploadDropzone } from "./upload-dropzone";

interface Props {
  gallery: Gallery;
  photos: GalleryPhoto[];
  folders: GalleryFolder[];
  selection: GallerySelection | null;
  jobName: string | null;
}

const MODE_LABELS = { selection: "Seleção", delivery: "Entrega" };
const STATUS_LABELS = { published: "Publicada", draft: "Rascunho" };

export function GalleryDetailClient({
  gallery: initialGallery,
  photos: initialPhotos,
  folders: initialFolders,
  selection,
  jobName,
}: Props) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initialGallery);
  const [photos, setPhotos] = useState(initialPhotos);
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modeConfirmOpen, setModeConfirmOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<"selection" | "delivery">("delivery");
  const [newFolderName, setNewFolderName] = useState("");
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectionTab, setSelectionTab] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${appUrl}/g/${gallery.slug}`;

  function handleModeToggle() {
    const next = gallery.mode === "selection" ? "delivery" : "selection";
    setTargetMode(next);
    setModeConfirmOpen(true);
  }

  function confirmModeChange() {
    setModeConfirmOpen(false);
    startTransition(async () => {
      const res = await setGalleryMode(gallery.id, targetMode);
      if (res.ok) {
        setGallery((g) => ({ ...g, mode: targetMode }));
      }
    });
  }

  function handlePublishToggle() {
    startTransition(async () => {
      const res =
        gallery.status === "published"
          ? await archiveGallery(gallery.id)
          : await publishGallery(gallery.id);
      if (res.ok) {
        setGallery((g) => ({
          ...g,
          status: g.status === "published" ? "draft" : "published",
        }));
      }
    });
  }

  function handleDeleteGallery() {
    setDeleteOpen(false);
    startTransition(async () => {
      const res = await deleteGallery(gallery.id);
      if (res.ok) router.push("/galerias");
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await createFolder(gallery.id, newFolderName.trim());
    if (res.ok) {
      setFolders((f) => [...f, res.folder]);
      setNewFolderName("");
      setFolderFormOpen(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    const res = await deletePhoto(photoId, gallery.id);
    if (res.ok) setPhotos((p) => p.filter((ph) => ph.id !== photoId));
  }

  const onUploadComplete = useCallback(
    (newPhotos: GalleryPhoto[]) => {
      setPhotos((p) => [...p, ...newPhotos]);
      setUploadOpen(false);
    },
    []
  );

  const visiblePhotos = activeFolder
    ? photos.filter((p) => p.folder_id === activeFolder)
    : photos;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/galerias"
          className="flex w-fit items-center gap-1 text-xs text-ds-muted hover:text-ds-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Todas as galerias
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ds-ink">{gallery.title}</h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  gallery.status === "published"
                    ? "bg-ds-success-soft text-ds-success"
                    : "bg-ds-cream text-ds-muted"
                )}
              >
                {STATUS_LABELS[gallery.status]}
              </span>
            </div>
            {jobName && (
              <p className="text-sm text-ds-muted">Job: {jobName}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-ds-danger" />
            </Button>
            <Button
              variant={gallery.status === "published" ? "secondary" : "primary"}
              size="sm"
              onClick={handlePublishToggle}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : gallery.status === "published" ? (
                <>
                  <X className="h-4 w-4" /> Despublicar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-3 rounded-ds-lg border border-ds-border bg-ds-cream/50 p-3">
        {/* Modo */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ds-muted">Modo:</span>
          <button
            type="button"
            onClick={handleModeToggle}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-ds-pill px-3 py-1 text-xs font-semibold transition-colors",
              gallery.mode === "selection"
                ? "bg-ds-info/10 text-ds-info"
                : "bg-ds-accent/10 text-ds-accent"
            )}
          >
            {MODE_LABELS[gallery.mode]}
            <Pencil className="h-3 w-3 opacity-60" />
          </button>
        </div>

        <div className="h-4 w-px bg-ds-border" />

        {/* Link público */}
        {gallery.status === "published" && (
          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="max-w-[200px] truncate text-xs text-ds-accent underline-offset-2 hover:underline"
            >
              {publicUrl}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded p-1 hover:bg-ds-cream"
              title="Copiar link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-ds-success" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-ds-muted" />
              )}
            </button>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setFolderFormOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            Pasta
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Subir fotos
          </Button>
        </div>
      </div>

      {/* Seleção recebida — aviso */}
      {selection && (
        <button
          type="button"
          onClick={() => setSelectionTab((v) => !v)}
          className="flex items-center gap-2 rounded-ds-lg border border-ds-success/30 bg-ds-success-soft px-4 py-3 text-sm text-ds-success transition-colors hover:bg-ds-success/10"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            O cliente enviou uma seleção de{" "}
            <strong>{selection.selected_photo_ids.length}</strong> foto
            {selection.selected_photo_ids.length !== 1 ? "s" : ""}.
          </span>
          <span className="ml-auto text-xs underline">
            {selectionTab ? "Fechar" : "Ver seleção"}
          </span>
        </button>
      )}

      {/* Seleção expandida */}
      {selectionTab && selection && (
        <ClientSelectionView
          selection={selection}
          photos={photos}
          galleryId={gallery.id}
        />
      )}

      {/* Formulário nova pasta */}
      {folderFormOpen && (
        <form
          onSubmit={handleCreateFolder}
          className="flex items-center gap-2 rounded-ds-lg border border-ds-border bg-ds-surface p-3"
        >
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nome da pasta..."
            className="flex-1 rounded-ds-md border border-ds-border bg-ds-cream px-3 py-1.5 text-sm focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
          />
          <Button type="submit" size="sm">Criar</Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFolderFormOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Abas de pastas */}
      {folders.length > 0 && (
        <div className="flex gap-1 border-b border-ds-border">
          <button
            type="button"
            onClick={() => setActiveFolder(null)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeFolder === null
                ? "border-b-2 border-ds-accent text-ds-accent"
                : "text-ds-muted hover:text-ds-ink"
            )}
          >
            Todas ({photos.length})
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFolder(f.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeFolder === f.id
                  ? "border-b-2 border-ds-accent text-ds-accent"
                  : "text-ds-muted hover:text-ds-ink"
              )}
            >
              {f.name} ({photos.filter((p) => p.folder_id === f.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Grid de fotos */}
      {visiblePhotos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-ds-lg border-2 border-dashed border-ds-border py-16">
          <Images className="h-10 w-10 text-ds-muted/40" />
          <p className="text-sm text-ds-muted">Nenhuma foto ainda. Suba as primeiras fotos.</p>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Subir fotos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visiblePhotos.map((photo) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              isCover={photo.id === gallery.cover_photo_id}
              onDelete={() => handleDeletePhoto(photo.id)}
            />
          ))}
        </div>
      )}

      {/* Upload */}
      {uploadOpen && (
        <UploadDropzone
          galleryId={gallery.id}
          folderId={activeFolder}
          onComplete={onUploadComplete}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {/* Confirmar troca de modo */}
      <DestructiveDialog
        open={modeConfirmOpen}
        onClose={() => setModeConfirmOpen(false)}
        title={`Trocar para modo ${MODE_LABELS[targetMode]}?`}
        objectName={gallery.title}
        consequence={
          targetMode === "delivery"
            ? "As fotos serão exibidas sem marca d'água e o download será liberado."
            : "As fotos passarão a ser exibidas com marca d'água e o download será bloqueado."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModeConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmModeChange}>Confirmar</Button>
          </>
        }
      />

      {/* Excluir galeria */}
      <DestructiveDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir galeria?"
        objectName={gallery.title}
        consequence="Todas as fotos serão removidas permanentemente. Esta ação não pode ser desfeita."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteGallery} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Excluir
            </Button>
          </>
        }
      />

      {/* Painel de configurações */}
      <GallerySettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gallery={gallery}
        onUpdate={(updated) => setGallery((g) => ({ ...g, ...updated }))}
      />
    </div>
  );
}

function PhotoThumb({
  photo,
  isCover,
  onDelete,
}: {
  photo: GalleryPhoto;
  isCover: boolean;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-ds-md bg-ds-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/gallery/image/${photo.id}?w=480`}
        alt={photo.filename}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />

      {isCover && (
        <span className="absolute left-1.5 top-1.5 rounded bg-ds-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
          Capa
        </span>
      )}

      <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-ds-ink/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="m-1.5 rounded-full bg-white/90 p-1.5 text-ds-danger hover:bg-white"
          title="Remover foto"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <DestructiveDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remover foto?"
        objectName={photo.filename}
        consequence="A foto será removida da galeria e do storage."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Remover
            </Button>
          </>
        }
      />
    </div>
  );
}
