import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { listGalleriesForAccount } from "@/lib/gallery/actions";
import { createClient } from "@/lib/supabase/server";
import { GaleriasClient } from "./galerias-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerias",
};

export default async function GaleriasPage() {
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

  const [galleries, jobsRes] = await Promise.all([
    listGalleriesForAccount(),
    supabase
      .from("jobs")
      .select("id, name, contact_id")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: false }),
  ]);

  const jobs = (jobsRes.data ?? []).map((j) => ({ id: j.id, name: j.name }));

  return <GaleriasClient galleries={galleries} jobs={jobs} />;
}
