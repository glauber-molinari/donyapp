import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { createClient } from "@/lib/supabase/server";
import type { WatermarkConfig } from "@/types/gallery";

import { WatermarkSettingsClient } from "./watermark-settings-client";

export const metadata: Metadata = { title: "Galeria — Marca d'Água" };

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG: WatermarkConfig = {
  opacity: 40,
  scale: 20,
  rotation: -30,
};

export default async function WatermarkSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("accounts")
    .select("id, subscription:subscriptions(plan), watermark_config, watermark_logo_url")
    .maybeSingle();

  if (!account) redirect("/login");

  const sub = Array.isArray(account.subscription)
    ? account.subscription[0]
    : account.subscription;
  const isPro = sub?.plan === "pro";
  const galeriasEnabled = isPro && (await isFeatureEnabled("galerias"));

  if (!galeriasEnabled) return notFound();

  const config: WatermarkConfig =
    account.watermark_config && typeof account.watermark_config === "object"
      ? (account.watermark_config as WatermarkConfig)
      : DEFAULT_CONFIG;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Marca d&apos;água</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Configure o logo e o estilo aplicados automaticamente às fotos nas galerias em modo
          Seleção.
        </p>
      </div>

      <WatermarkSettingsClient
        accountId={account.id}
        initialLogoUrl={account.watermark_logo_url ?? null}
        initialConfig={config}
      />
    </div>
  );
}
