"use client";

import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Images,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DestructiveDialog } from "@/components/ui/dialog";
import {
  archiveGallery,
  createFolder,
  deleteFolder,
  deleteGallery,
  deletePhoto,
  publishGallery,
  renameFolder,
  setCoverPhoto,
} from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";
import type {
  Gallery,
  GalleryFolder,
  GalleryPhoto,
  GallerySelection,
} from "@/types/gallery";

import { ClientSelectionView } from "./client-selection-view";
import {
  GallerySettingsView,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "./gallery-settings-view";
import { UploadDropzone } from "./upload-dropzone";

interface Props {
  gallery: Gallery;
  photos: GalleryPhoto[];
  folders: GalleryFolder[];
  selection: GallerySelection | null;
  jobName: string | null;
  jobDate: string | null;
}

type WorkspaceTab = "photos" | "settings";
type SortOption = "uploaded_desc" | "uploaded_asc" | "name_asc" | "name_desc";

const SORT_LABELS: Record<SortOption, string> = {
  uploaded_desc: "Envio: mais recente",
  uploaded_asc: "Envio: mais antigo",
  name_asc: "Nome: A–Z",
  name_desc: "Nome: Z–A",
};

function formatDisplayDate(iso: string | null) {
  if (!iso) return null;
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sortPhotos(photos: GalleryPhoto[], sort: SortOption) {
  const copy = [...photos];
  switch (sort) {
    case "uploaded_desc":
      return copy.sort(
        (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    case "uploaded_asc":
      return copy.sort(
        (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
      );
    case "name_asc":
      return copy.sort((a, b) => a.filename.localeCompare(b.filename, "pt-BR"));
    case "name_desc":
      return copy.sort((a, b) => b.filename.localeCompare(a.filename, "pt-BR"));
    default:
      return copy;
  }
}

export function GalleryDetailClient({
  gallery: initialGallery,
  photos: initialPhotos,
  folders: initialFolders,
  selection,
  jobName,
  jobDate,
}: Props) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initialGallery);
  const [photos, setPhotos] = useState(initialPhotos);
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState<string | null>(
    initialFolders[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("photos");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("geral");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("uploaded_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [selectionTab, setSelectionTab] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [coverSelectMode, setCoverSelectMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${appUrl}/g/${gallery.slug}`;
  const displayDate = formatDisplayDate(jobDate) ?? formatDisplayDate(gallery.created_at);

  const folderPhotos = useMemo(() => {
    const inFolder = activeFolder
      ? photos.filter((p) => p.folder_id === activeFolder)
      : photos;
    const q = search.trim().toLowerCase();
    const filtered = q
      ? inFolder.filter((p) => p.filename.toLowerCase().includes(q))
      : inFolder;
    return sortPhotos(filtered, sort);
  }, [photos, activeFolder, search, sort]);

  const activeFolderName =
    folders.find((f) => f.id === activeFolder)?.name ?? "Todas as fotos";

  const coverPhoto = photos.find((p) => p.id === gallery.cover_photo_id) ?? photos[0];

  const onUploadComplete = useCallback(
    (newPhotos: GalleryPhoto[]) => {
      setPhotos((p) => [...p, ...newPhotos]);
      setShowUploadPanel(false);
      if (!gallery.cover_photo_id && newPhotos[0]) {
        void setCoverPhoto(gallery.id, newPhotos[0].id).then((res) => {
          if (res.ok) setGallery((g) => ({ ...g, cover_photo_id: newPhotos[0].id }));
        });
      }
    },
    [gallery.cover_photo_id, gallery.id]
  );

  function handlePublishToggle(nextStatus: "draft" | "published") {
    setStatusOpen(false);
    if (nextStatus === gallery.status) return;
    startTransition(async () => {
      const res =
        nextStatus === "published"
          ? await publishGallery(gallery.id)
          : await archiveGallery(gallery.id);
      if (res.ok) setGallery((g) => ({ ...g, status: nextStatus }));
    });
  }

  function handleDeleteGallery() {
    setDeleteOpen(false);
    startTransition(async () => {
      const res = await deleteGallery(gallery.id);
      if (res.ok) router.push("/galerias");
    });
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await createFolder(gallery.id, newFolderName.trim());
    if (res.ok) {
      setFolders((f) => [...f, res.folder]);
      setActiveFolder(res.folder.id);
      setNewFolderName("");
      setFolderFormOpen(false);
    }
  }

  async function handleRenameFolder(folderId: string) {
    const name = editingFolderName.trim();
    setEditingFolderId(null);
    if (!name) return;
    setFolders((f) => f.map((fo) => (fo.id === folderId ? { ...fo, name } : fo)));
    const res = await renameFolder(folderId, name);
    if (!res.ok) router.refresh();
  }

  async function handleDeleteFolder(folderId: string) {
    setFolders((f) => f.filter((fo) => fo.id !== folderId));
    setPhotos((p) =>
      p.map((ph) => (ph.folder_id === folderId ? { ...ph, folder_id: null } : ph))
    );
    if (activeFolder === folderId) {
      setActiveFolder(() => {
        const remaining = folders.filter((f) => f.id !== folderId);
        return remaining[0]?.id ?? null;
      });
    }
    await deleteFolder(folderId, gallery.id);
  }

  async function handleDeletePhoto(photoId: string) {
    const res = await deletePhoto(photoId, gallery.id);
    if (res.ok) {
      setPhotos((p) => p.filter((ph) => ph.id !== photoId));
      if (gallery.cover_photo_id === photoId) {
        setGallery((g) => ({ ...g, cover_photo_id: null }));
      }
    }
  }

  async function handleSetCover(photoId: string) {
    setCoverSelectMode(false);
    setGallery((g) => ({ ...g, cover_photo_id: photoId }));
    const res = await setCoverPhoto(gallery.id, photoId);
    if (!res.ok) router.refresh();
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-3rem)] flex-col sm:-mx-6 sm:-mt-6 md:min-h-[calc(100dvh-3.5rem)]">
      {/* Top bar */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ds-border bg-ds-surface px-4 py-3 md:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/galerias"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-lg text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold text-ds-ink">{gallery.title}</h1>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-ds-pill border border-ds-border bg-ds-cream/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-muted hover:border-ds-border-strong"
                >
                  {gallery.status === "published" ? "Publicada" : "Rascunho"}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {statusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-ds-xl border border-ds-border bg-ds-surface py-1 shadow-ds-md">
                      <button
                        type="button"
                        onClick={() => handlePublishToggle("published")}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ds-cream"
                      >
                        Publicar
                        {gallery.status === "published" && <Check className="h-4 w-4 text-ds-success" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePublishToggle("draft")}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ds-cream"
                      >
                        Rascunho
                        {gallery.status === "draft" && <Check className="h-4 w-4 text-ds-success" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {(displayDate || jobName) && (
              <p className="truncate text-xs text-ds-muted">
                {displayDate}
                {displayDate && jobName && <span className="mx-1.5 text-ds-muted-2">·</span>}
                {jobName && <span className="text-ds-muted-2">Job: {jobName}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar"
              className="w-full rounded-ds-lg border border-ds-border bg-ds-cream/50 py-2 pl-9 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gallery.status === "published" ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-ds-lg px-3 py-2 text-sm font-medium text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink sm:flex"
            >
              Pré-visualização
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span
              className="hidden cursor-not-allowed items-center gap-1.5 rounded-ds-lg px-3 py-2 text-sm text-ds-muted-2 sm:flex"
              title="Publique para pré-visualizar como cliente"
            >
              Pré-visualização
            </span>
          )}
          <Button
            size="sm"
            onClick={() =>
              handlePublishToggle(gallery.status === "published" ? "draft" : "published")
            }
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : gallery.status === "published" ? (
              "Despublicar"
            ) : (
              "Publicar"
            )}
          </Button>

          {/* Mais */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-ds-lg border border-ds-border text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
              aria-label="Mais ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[170px] rounded-ds-xl border border-ds-border bg-ds-surface py-1 shadow-ds-md">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ds-danger hover:bg-ds-danger-soft"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir galeria
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Seleção recebida */}
      {selection && (
        <div
          className={cn(
            "px-4 pt-4 sm:px-5",
            !selectionTab && "pb-4 sm:pb-5"
          )}
        >
          <Card className="flex items-center justify-between gap-3 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 items-center justify-center rounded-ds-xl bg-ds-success-soft p-2 text-ds-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              </div>
              <p className="text-sm text-ds-ink">
                O cliente enviou uma seleção de{" "}
                <strong className="font-semibold">
                  {selection.selected_photo_ids.length}
                </strong>{" "}
                foto{selection.selected_photo_ids.length !== 1 ? "s" : ""}.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectionTab((v) => !v)}
            >
              {selectionTab ? "Fechar" : "Ver seleção"}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  selectionTab && "rotate-180"
                )}
              />
            </Button>
          </Card>
        </div>
      )}

      {selectionTab && selection && (
        <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <ClientSelectionView selection={selection} photos={photos} galleryId={gallery.id} />
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-ds-border bg-ds-surface lg:w-60">
          <div className="p-4">
            <div className="group relative aspect-square overflow-hidden rounded-ds-lg bg-ds-cream">
              {coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/gallery/image/${coverPhoto.id}?w=240&ctx=manage`}
                  alt="Capa da galeria"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Images className="h-8 w-8 text-ds-muted/40" />
                </div>
              )}
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("photos");
                    setCoverSelectMode(true);
                  }}
                  className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {coverPhoto ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {coverPhoto ? "Trocar capa" : "Adicionar capa"}
                </button>
              )}
            </div>
          </div>

          <div className="flex border-b border-ds-hairline px-2">
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                activeTab === "photos"
                  ? "border-b-2 border-ds-ink text-ds-ink"
                  : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <Images className="h-4 w-4" />
              Fotos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                activeTab === "settings"
                  ? "border-b-2 border-ds-ink text-ds-ink"
                  : "text-ds-muted hover:text-ds-ink"
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </button>
          </div>

          {activeTab === "photos" && (
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ds-muted-2">
                  Conjuntos
                </span>
                <button
                  type="button"
                  onClick={() => setFolderFormOpen(true)}
                  className="flex items-center gap-0.5 text-xs font-medium text-ds-ink hover:text-ds-accent"
                >
                  <Plus className="h-3 w-3" />
                  Conjunto
                </button>
              </div>

              {folderFormOpen && (
                <form onSubmit={handleCreateFolder} className="mb-2 flex gap-1 px-1">
                  <input
                    type="text"
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nome do conjunto"
                    className="min-w-0 flex-1 rounded-ds-md border border-ds-border bg-ds-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2 text-xs">
                    Ok
                  </Button>
                </form>
              )}

              <div className="flex flex-col gap-0.5 overflow-y-auto">
                {folders.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-ds-muted">Nenhum conjunto ainda.</p>
                ) : (
                  folders.map((folder) => {
                    const count = photos.filter((p) => p.folder_id === folder.id).length;
                    const isEditing = editingFolderId === folder.id;
                    return (
                      <FolderRow
                        key={folder.id}
                        folder={folder}
                        count={count}
                        active={activeFolder === folder.id}
                        isEditing={isEditing}
                        editingName={editingFolderName}
                        onActivate={() => setActiveFolder(folder.id)}
                        onStartRename={() => {
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        onChangeName={setEditingFolderName}
                        onSubmitRename={() => handleRenameFolder(folder.id)}
                        onCancelRename={() => setEditingFolderId(null)}
                        onDelete={() => handleDeleteFolder(folder.id)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col gap-0.5 overflow-y-auto p-3">
              {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = settingsSection === id;
                const badge =
                  (id === "download" && gallery.download_enabled) ||
                  (id === "favoritos" && gallery.favorite_enabled);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSettingsSection(id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-ds-lg px-2.5 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-ds-cream font-medium text-ds-ink"
                        : "text-ds-muted hover:bg-ds-cream/70 hover:text-ds-ink"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="rounded-ds-pill bg-ds-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-ds-info">
                        Ativo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col bg-ds-surface">
          {activeTab === "settings" ? (
            <GallerySettingsView
              gallery={gallery}
              section={settingsSection}
              onUpdate={(partial) => setGallery((g) => ({ ...g, ...partial }))}
            />
          ) : (
            <>
              {coverSelectMode ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-accent/40 bg-ds-accent-soft px-4 py-3 md:px-6">
                  <p className="text-sm font-medium text-ds-ink">
                    Clique em uma foto para definir como capa
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setCoverSelectMode(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-hairline px-4 py-3 md:px-6">
                  <h2 className="text-lg font-semibold text-ds-ink">{activeFolderName}</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative md:hidden">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ds-muted" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Procurar"
                        className="w-36 rounded-ds-lg border border-ds-border bg-ds-cream/50 py-1.5 pl-8 pr-2 text-xs"
                      />
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen((v) => !v)}
                        className="flex items-center gap-1.5 rounded-ds-lg border border-ds-border px-3 py-1.5 text-xs font-medium text-ds-muted hover:bg-ds-cream"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        Ordenar
                      </button>
                      {sortOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                          <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-ds-xl border border-ds-border bg-ds-surface py-1 shadow-ds-md">
                            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setSort(key);
                                  setSortOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ds-cream"
                              >
                                {SORT_LABELS[key]}
                                {sort === key && <Check className="h-4 w-4 text-ds-success" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUploadPanel(true)}
                      className="flex items-center gap-1 text-sm font-medium text-ds-ink hover:text-ds-accent"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar mídia
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {folderPhotos.length === 0 && !showUploadPanel ? (
                  <UploadDropzone
                    galleryId={gallery.id}
                    folderId={activeFolder}
                    onComplete={onUploadComplete}
                    variant="inline"
                  />
                ) : (
                  <div className="flex flex-col gap-6">
                    {(showUploadPanel || folderPhotos.length === 0) && (
                      <UploadDropzone
                        galleryId={gallery.id}
                        folderId={activeFolder}
                        onComplete={onUploadComplete}
                        variant="inline"
                      />
                    )}
                    {folderPhotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {folderPhotos.map((photo) => (
                          <PhotoThumb
                            key={photo.id}
                            photo={photo}
                            isCover={photo.id === gallery.cover_photo_id}
                            coverSelectMode={coverSelectMode}
                            onDelete={() => handleDeletePhoto(photo.id)}
                            onSetCover={() => handleSetCover(photo.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

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
    </div>
  );
}

function FolderRow({
  folder,
  count,
  active,
  isEditing,
  editingName,
  onActivate,
  onStartRename,
  onChangeName,
  onSubmitRename,
  onCancelRename,
  onDelete,
}: {
  folder: GalleryFolder;
  count: number;
  active: boolean;
  isEditing: boolean;
  editingName: string;
  onActivate: () => void;
  onStartRename: () => void;
  onChangeName: (v: string) => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.right - 150 });
  }

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitRename();
        }}
        className="flex gap-1 px-1 py-1"
      >
        <input
          type="text"
          autoFocus
          value={editingName}
          onChange={(e) => onChangeName(e.target.value)}
          onBlur={onSubmitRename}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancelRename();
          }}
          className="min-w-0 flex-1 rounded-ds-md border border-ds-border bg-ds-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
        />
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-ds-lg px-2 py-2 text-sm transition-colors",
        active
          ? "bg-ds-cream font-medium text-ds-ink"
          : "text-ds-muted hover:bg-ds-cream/70 hover:text-ds-ink"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-30" />
      <button
        type="button"
        onClick={onActivate}
        onDoubleClick={onStartRename}
        className="min-w-0 flex-1 truncate text-left"
      >
        {folder.name}
      </button>
      <span className="text-xs text-ds-muted-2">({count})</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (menuPos ? setMenuPos(null) : openMenu())}
        className="flex h-6 w-6 items-center justify-center rounded text-ds-muted-2 opacity-0 transition-opacity hover:text-ds-ink group-hover:opacity-100"
        aria-label="Opções do conjunto"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {menuPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPos(null)} />
          <div
            className="fixed z-50 min-w-[150px] rounded-ds-lg border border-ds-border bg-ds-surface py-1 shadow-ds-md"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuPos(null);
                onStartRename();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-ds-cream"
            >
              <Pencil className="h-3.5 w-3.5" />
              Renomear
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuPos(null);
                setConfirmDelete(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ds-danger hover:bg-ds-danger-soft"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir conjunto
            </button>
          </div>
        </>
      )}

      <DestructiveDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir conjunto?"
        objectName={folder.name}
        consequence="As fotos deste conjunto continuam na galeria, sem conjunto."
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
              Excluir
            </Button>
          </>
        }
      />
    </div>
  );
}

function PhotoThumb({
  photo,
  isCover,
  coverSelectMode,
  onDelete,
  onSetCover,
}: {
  photo: GalleryPhoto;
  isCover: boolean;
  coverSelectMode: boolean;
  onDelete: () => void;
  onSetCover: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (coverSelectMode) {
    return (
      <button
        type="button"
        onClick={onSetCover}
        className={cn(
          "group relative aspect-square overflow-hidden rounded-ds-md bg-ds-cream ring-2 transition-all",
          isCover ? "ring-ds-accent" : "ring-transparent hover:ring-ds-accent/60"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/gallery/image/${photo.id}?w=400&ctx=manage`}
          alt={photo.filename}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-ds-pill bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ds-ink">
            {isCover ? "Capa atual" : "Definir capa"}
          </span>
        </div>
        {isCover && (
          <span className="absolute left-1.5 top-1.5 rounded-ds-sm bg-ds-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Capa
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-ds-md bg-ds-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/gallery/image/${photo.id}?w=400&ctx=manage`}
        alt={photo.filename}
        className="h-full w-full object-cover transition-transform duration-ds-fast group-hover:scale-[1.02]"
        loading="lazy"
      />

      {isCover && (
        <span className="absolute left-1.5 top-1.5 rounded-ds-sm bg-ds-ink px-1.5 py-0.5 text-[10px] font-semibold text-ds-on-dark">
          Capa
        </span>
      )}

      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full bg-ds-surface/95 p-1 text-ds-muted shadow-ds-sm hover:text-ds-ink"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-ds-lg border border-ds-border bg-ds-surface py-1 shadow-ds-md">
              {!isCover && (
                <button
                  type="button"
                  onClick={() => {
                    onSetCover();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-ds-cream"
                >
                  Definir como capa
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
                className="w-full px-3 py-2 text-left text-xs text-ds-danger hover:bg-ds-danger-soft"
              >
                Remover
              </button>
            </div>
          </>
        )}
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
