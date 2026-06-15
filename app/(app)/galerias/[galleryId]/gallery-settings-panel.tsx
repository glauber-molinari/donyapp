"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SidePanel, PanelField, PanelFieldCard, panelInputCls } from "@/components/ui/side-panel";
import { updateGallerySettings } from "@/lib/gallery/actions";
import type { Gallery } from "@/types/gallery";

interface Props {
  open: boolean;
  onClose: () => void;
  gallery: Gallery;
  onUpdate: (partial: Partial<Gallery>) => void;
}

export function GallerySettingsPanel({ open, onClose, gallery, onUpdate }: Props) {
  const [slug, setSlug] = useState(gallery.slug);
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState(
    gallery.expires_at ? gallery.expires_at.slice(0, 10) : ""
  );
  const [downloadEnabled, setDownloadEnabled] = useState(gallery.download_enabled);
  const [favoriteEnabled, setFavoriteEnabled] = useState(gallery.favorite_enabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateGallerySettings(gallery.id, {
        slug: slug.trim() || undefined,
        password: clearPassword ? null : password || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        download_enabled: downloadEnabled,
        favorite_enabled: favoriteEnabled,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onUpdate({
        slug: slug.trim() || gallery.slug,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        download_enabled: downloadEnabled,
        favorite_enabled: favoriteEnabled,
        password_hash: clearPassword ? null : gallery.password_hash,
      });
      onClose();
    });
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Configurações da Galeria"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        {error ? (
          <p className="rounded-ds-md border border-ds-danger/30 bg-ds-danger-soft px-3 py-2 text-sm text-ds-danger">
            {error}
          </p>
        ) : null}

        <PanelFieldCard>
          <PanelField label="URL da galeria" htmlFor="gallery-slug">
            <div className="flex items-center gap-1">
              <span className="text-xs text-ds-muted">/g/</span>
              <input
                id="gallery-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={panelInputCls}
                placeholder="minha-galeria"
              />
            </div>
          </PanelField>
        </PanelFieldCard>

        <PanelFieldCard>
          <PanelField label="Senha de acesso" htmlFor="gallery-password">
            <input
              id="gallery-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setClearPassword(false);
              }}
              className={panelInputCls}
              placeholder={
                gallery.password_hash
                  ? "Deixe em branco para manter"
                  : "Opcional"
              }
            />
          </PanelField>
          {gallery.password_hash && (
            <div className="flex items-center gap-2">
              <input
                id="gallery-clear-password"
                type="checkbox"
                checked={clearPassword}
                onChange={(e) => {
                  setClearPassword(e.target.checked);
                  if (e.target.checked) setPassword("");
                }}
                className="h-4 w-4 accent-ds-accent"
              />
              <label
                htmlFor="gallery-clear-password"
                className="text-xs text-ds-muted"
              >
                Remover senha
              </label>
            </div>
          )}
        </PanelFieldCard>

        <PanelFieldCard>
          <PanelField label="Expiração" htmlFor="gallery-expires">
            <input
              id="gallery-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={panelInputCls}
            />
          </PanelField>
          {expiresAt && (
            <button
              type="button"
              onClick={() => setExpiresAt("")}
              className="text-xs text-ds-muted underline"
            >
              Remover expiração
            </button>
          )}
        </PanelFieldCard>

        <PanelFieldCard>
          <PanelField label="Download" htmlFor="gallery-download">
            <Switch
              id="gallery-download"
              checked={downloadEnabled}
              onChange={setDownloadEnabled}
              label="Permitir download"
            />
          </PanelField>
          <PanelField label="Favoritos" htmlFor="gallery-favorites">
            <Switch
              id="gallery-favorites"
              checked={favoriteEnabled}
              onChange={setFavoriteEnabled}
              label="Permitir favoritar fotos"
            />
          </PanelField>
        </PanelFieldCard>
      </div>
    </SidePanel>
  );
}
