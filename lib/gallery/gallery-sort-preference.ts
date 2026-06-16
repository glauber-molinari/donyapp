export type GalleryPhotoSort =
  | "uploaded_desc"
  | "uploaded_asc"
  | "name_asc"
  | "name_desc";

const STORAGE_PREFIX = "donyapp:gallery-photo-sort:";

const VALID_SORTS = new Set<GalleryPhotoSort>([
  "uploaded_desc",
  "uploaded_asc",
  "name_asc",
  "name_desc",
]);

export function loadGalleryPhotoSort(galleryId: string): GalleryPhotoSort {
  if (typeof window === "undefined") return "uploaded_desc";
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${galleryId}`);
    if (raw && VALID_SORTS.has(raw as GalleryPhotoSort)) {
      return raw as GalleryPhotoSort;
    }
  } catch {
    // ignore quota / private mode
  }
  return "uploaded_desc";
}

export function saveGalleryPhotoSort(galleryId: string, sort: GalleryPhotoSort): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${galleryId}`, sort);
  } catch {
    // ignore
  }
}
