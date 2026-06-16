import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { gallerySessionCookieName, hasGallerySession } from "@/lib/gallery/gallery-session";
import { sortByFilename } from "@/lib/gallery/sort-photos";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PublicGalleryData } from "@/types/gallery";

import { GalleryPublicClient } from "./gallery-public-client";
import { PasswordGate } from "./password-gate";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const svc = createServiceRoleClient();
  if (!svc) return {};
  const { data } = await svc
    .from("galleries")
    .select("title")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();
  return { title: data?.title ?? "Galeria" };
}

export const dynamic = "force-dynamic";

export default async function GalleryPublicPage({ params }: Props) {
  const svc = createServiceRoleClient();
  if (!svc) return notFound();

  const { data: gallery } = await svc
    .from("galleries")
    .select("id, slug, title, mode, status, expires_at, password_hash, download_enabled, favorite_enabled, cover_photo_id, account_id, job_id, selection_reset_at")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!gallery || gallery.status !== "published") return notFound();

  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-3xl">📷</p>
        <h1 className="mt-4 font-serif text-2xl font-light tracking-wide text-stone-800">
          Galeria expirada
        </h1>
        <p className="mt-2 text-sm text-stone-400">
          Esta galeria não está mais disponível.
        </p>
      </div>
    );
  }

  // Password check
  if (gallery.password_hash) {
    const cookieName = gallerySessionCookieName(gallery.id);
    const sessionCookie = cookies().get(cookieName);
    if (!hasGallerySession(gallery.id, sessionCookie?.value)) {
      return (
        <PasswordGate
          slug={params.slug}
          title={gallery.title}
          coverPhotoId={gallery.cover_photo_id}
        />
      );
    }
  }

  // Fetch account info
  const { data: account } = await svc
    .from("accounts")
    .select("name, watermark_logo_url")
    .eq("id", gallery.account_id)
    .maybeSingle();

  // Fetch job info
  const jobName = gallery.job_id
    ? (
        await svc.from("jobs").select("name, job_date").eq("id", gallery.job_id).maybeSingle()
      ).data?.name ?? null
    : null;

  const jobDate = gallery.job_id
    ? (
        await svc.from("jobs").select("job_date").eq("id", gallery.job_id).maybeSingle()
      ).data?.job_date ?? null
    : null;

  // Fetch folders + photos + última seleção já enviada (trava o estado no link).
  // Seleções anteriores a selection_reset_at são ignoradas (fotógrafo liberou nova escolha).
  let selectionQuery = svc
    .from("gallery_selections")
    .select("selected_photo_ids, client_note")
    .eq("gallery_id", gallery.id);

  if (gallery.selection_reset_at) {
    selectionQuery = selectionQuery.gt("submitted_at", gallery.selection_reset_at);
  }

  const [foldersRes, photosRes, selectionRes] = await Promise.all([
    svc
      .from("gallery_folders")
      .select("id, name, display_order")
      .eq("gallery_id", gallery.id)
      .order("display_order"),
    svc
      .from("gallery_photos")
      .select("id, folder_id, filename, display_order")
      .eq("gallery_id", gallery.id),
    selectionQuery.order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const publicData: PublicGalleryData = {
    id: gallery.id,
    slug: gallery.slug,
    title: gallery.title,
    mode: gallery.mode as "selection" | "delivery",
    expires_at: gallery.expires_at,
    download_enabled: gallery.download_enabled,
    favorite_enabled: gallery.favorite_enabled,
    job_name: jobName,
    job_date: jobDate,
    studio_name: account?.name ?? "Estúdio",
    studio_logo_url: account?.watermark_logo_url ?? null,
    cover_photo_id: gallery.cover_photo_id,
    folders: (foldersRes.data ?? []) as PublicGalleryData["folders"],
    photos: sortByFilename((photosRes.data ?? []) as PublicGalleryData["photos"]),
    existing_selection: selectionRes.data
      ? {
          selected_photo_ids: selectionRes.data.selected_photo_ids,
          client_note: selectionRes.data.client_note,
        }
      : null,
  };

  return <GalleryPublicClient gallery={publicData} />;
}
