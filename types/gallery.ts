export type GalleryMode = "selection" | "delivery";
export type GalleryStatus = "draft" | "published";

export interface WatermarkConfig {
  type?: "logo" | "text";
  text?: string;
  opacity?: number;   // 0-100
  scale?: number;     // percentage of image width (e.g. 20)
  rotation?: number;  // degrees (e.g. -30)
}

export interface GalleryFolder {
  id: string;
  gallery_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  gallery_id: string;
  folder_id: string | null;
  r2_key: string;
  filename: string;
  size_bytes: number;
  display_order: number;
  uploaded_at: string;
}

export interface GallerySelection {
  id: string;
  gallery_id: string;
  selected_photo_ids: string[];
  client_note: string | null;
  ip_hash: string | null;
  submitted_at: string;
}

export interface Gallery {
  id: string;
  account_id: string;
  job_id: string | null;
  slug: string;
  title: string;
  mode: GalleryMode;
  status: GalleryStatus;
  cover_photo_id: string | null;
  password_hash: string | null;
  expires_at: string | null;
  download_enabled: boolean;
  favorite_enabled: boolean;
  /** Seleções enviadas antes desse timestamp são ignoradas (fotógrafo "destravou" para o cliente escolher de novo). */
  selection_reset_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryWithCounts extends Gallery {
  photo_count: number;
  folder_count: number;
  has_selection: boolean;
  /** Até 4 ids de fotos para o mosaico do card (capa primeiro). */
  preview_photo_ids: string[];
}

/** Dados enviados ao cliente público (nunca inclui password_hash ou r2_key) */
export interface PublicGalleryData {
  id: string;
  slug: string;
  title: string;
  mode: GalleryMode;
  expires_at: string | null;
  download_enabled: boolean;
  favorite_enabled: boolean;
  job_name: string | null;
  job_date: string | null;
  studio_name: string;
  studio_logo_url: string | null;
  cover_photo_id: string | null;
  folders: Array<{ id: string; name: string; display_order: number }>;
  photos: Array<{
    id: string;
    folder_id: string | null;
    filename: string;
    display_order: number;
  }>;
  /** Última seleção já enviada por esse cliente, se houver — usada para travar o estado no link. */
  existing_selection: {
    selected_photo_ids: string[];
    client_note: string | null;
  } | null;
}

export interface UploadTicket {
  photoId: string;
  presignedUrl: string;
  r2Key: string;
}
