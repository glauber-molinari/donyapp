import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isFeatureEnabled } from "@/lib/feature-flags.server";
import {
  getGallery,
  getGallerySelection,
  listPhotos,
} from "@/lib/gallery/actions";
import { createClient } from "@/lib/supabase/server";
import { GalleryDetailClient } from "./gallery-detail-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeria",
};

interface Props {
  params: { galleryId: string };
}

export default async function GalleryDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.account_id) return notFound();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile.account_id)
    .maybeSingle();

  const isPro = sub?.plan === "pro";
  const flagOn = await isFeatureEnabled("galerias");
  if (!isPro || !flagOn) return notFound();

  const gallery = await getGallery(params.galleryId);
  if (!gallery) return notFound();

  const [photos, folders, selection] = await Promise.all([
    listPhotos(params.galleryId),
    supabase
      .from("gallery_folders")
      .select("*")
      .eq("gallery_id", params.galleryId)
      .order("display_order", { ascending: true }),
    getGallerySelection(params.galleryId),
  ]);

  // Job name + date
  let jobName: string | null = null;
  let jobDate: string | null = null;
  if (gallery.job_id) {
    const { data: job } = await supabase
      .from("jobs")
      .select("name, job_date")
      .eq("id", gallery.job_id)
      .maybeSingle();
    jobName = job?.name ?? null;
    jobDate = job?.job_date ?? null;
  }

  return (
    <GalleryDetailClient
      gallery={gallery}
      photos={photos}
      folders={(folders.data ?? []) as unknown as import("@/types/gallery").GalleryFolder[]}
      selection={selection}
      jobName={jobName}
      jobDate={jobDate}
    />
  );
}
