"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { removeWatermarkLogo, uploadWatermarkLogo } from "@/lib/gallery/watermark-logo";
import type { Json } from "@/types/database";
import type { WatermarkConfig } from "@/types/gallery";

interface Props {
  accountId: string;
  initialLogoUrl: string | null;
  initialConfig: WatermarkConfig;
}

export function WatermarkSettingsClient({ accountId, initialLogoUrl, initialConfig }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [config, setConfig] = useState<WatermarkConfig>(initialConfig);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    if (logoUrl) {
      await removeWatermarkLogo(supabase, logoUrl);
    }
    const result = await uploadWatermarkLogo(supabase, accountId, file);
    if (result.ok) {
      const newUrl = result.publicUrl;
      setLogoUrl(newUrl);
      await supabase
        .from("accounts")
        .update({ watermark_logo_url: newUrl })
        .eq("id", accountId);
    } else {
      setError(result.error);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemoveLogo() {
    if (!logoUrl) return;
    await removeWatermarkLogo(supabase, logoUrl);
    setLogoUrl(null);
    await supabase
      .from("accounts")
      .update({ watermark_logo_url: null })
      .eq("id", accountId);
  }

  async function handleSaveConfig() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: dbError } = await supabase
      .from("accounts")
      .update({ watermark_config: config as unknown as Json })
      .eq("id", accountId);
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function update(partial: Partial<WatermarkConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Logo section */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-ds-ink">Logo da marca d&apos;água</p>
          <p className="mt-0.5 text-xs text-ds-muted">
            PNG transparente ou SVG recomendado. Máx. 2 MB. Aparece em grade sobre as fotos no modo
            Seleção.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-ds-border bg-ds-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-0.5 text-ds-ink hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ds-border bg-ds-surface text-ds-muted hover:border-ds-accent hover:text-ds-accent"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </>
              )}
            </button>
          )}
          {logoUrl && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-ds-muted underline hover:text-ds-ink"
            >
              {uploading ? "Enviando…" : "Trocar"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Config sliders */}
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium text-ds-ink">Configurações</p>
          <p className="mt-0.5 text-xs text-ds-muted">
            Aplicadas a todas as galerias em modo Seleção desta conta.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-sm text-ds-ink">
              <span>Opacidade</span>
              <span className="text-xs text-ds-muted">{config.opacity ?? 40}%</span>
            </span>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={config.opacity ?? 40}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="h-1.5 w-full accent-ds-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-sm text-ds-ink">
              <span>Tamanho</span>
              <span className="text-xs text-ds-muted">{config.scale ?? 20}%</span>
            </span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={config.scale ?? 20}
              onChange={(e) => update({ scale: Number(e.target.value) })}
              className="h-1.5 w-full accent-ds-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-sm text-ds-ink">
              <span>Rotação</span>
              <span className="text-xs text-ds-muted">{config.rotation ?? -30}°</span>
            </span>
            <input
              type="range"
              min={-60}
              max={60}
              step={5}
              value={config.rotation ?? -30}
              onChange={(e) => update({ rotation: Number(e.target.value) })}
              className="h-1.5 w-full accent-ds-accent"
            />
          </label>
        </div>
      </div>

      {/* Pré-visualização gerada no servidor — mesmo algoritmo da galeria */}
      <div>
        <p className="mb-2 text-sm font-medium text-ds-ink">Pré-visualização</p>
        <p className="mb-2 text-xs text-ds-muted">
          Foto de exemplo com a marca d&apos;água aplicada em grade, como o cliente verá no modo
          Seleção.
        </p>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`${config.opacity}-${config.scale}-${config.rotation}-${logoUrl ?? "none"}`}
            src={`/api/watermark/preview?opacity=${config.opacity ?? 40}&scale=${config.scale ?? 20}&rotation=${config.rotation ?? -30}`}
            alt="Pré-visualização da marca d'água"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 rounded-ds-xl bg-ds-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar configurações
        </button>
        {saved && <span className="text-sm text-green-600">Salvo!</span>}
      </div>
    </div>
  );
}
