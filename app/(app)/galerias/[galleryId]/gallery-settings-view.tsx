"use client";

import {
  Calendar,
  Download,
  Heart,
  Loader2,
  Lock,
  Settings2,
} from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { panelInputCls } from "@/components/ui/side-panel";
import { updateGallerySettings, setGalleryMode } from "@/lib/gallery/actions";
import { cn } from "@/lib/utils";
import type { Gallery } from "@/types/gallery";

type SettingsSection = "geral" | "privacidade" | "download" | "favoritos";

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  icon: typeof Settings2;
}> = [
  { id: "geral", label: "Em geral", icon: Settings2 },
  { id: "privacidade", label: "Privacidade", icon: Lock },
  { id: "download", label: "Download", icon: Download },
  { id: "favoritos", label: "Favoritos", icon: Heart },
];

const MODE_LABELS = { selection: "Seleção", delivery: "Entrega" };

interface Props {
  gallery: Gallery;
  onUpdate: (partial: Partial<Gallery>) => void;
}

export function GallerySettingsView({ gallery, onUpdate }: Props) {
  const [section, setSection] = useState<SettingsSection>("geral");
  const [slug, setSlug] = useState(gallery.slug);
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState(
    gallery.expires_at ? gallery.expires_at.slice(0, 10) : ""
  );
  const [downloadEnabled, setDownloadEnabled] = useState(gallery.download_enabled);
  const [favoriteEnabled, setFavoriteEnabled] = useState(gallery.favorite_enabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modePending, setModePending] = useState(false);

  function handleSave() {
    setError(null);
    setSaved(false);
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function handleModeChange(next: "selection" | "delivery") {
    if (next === gallery.mode) return;
    setModePending(true);
    startTransition(async () => {
      const res = await setGalleryMode(gallery.id, next);
      if (res.ok) onUpdate({ mode: next });
      setModePending(false);
    });
  }

  return (
    <div className="flex min-h-0 flex-1">
      <nav className="hidden w-52 shrink-0 flex-col border-r border-ds-hairline bg-ds-cream/40 p-3 md:flex">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-ds-muted-2">
          Configurações
        </p>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "flex items-center gap-2.5 rounded-ds-lg px-2.5 py-2 text-left text-sm transition-colors",
              section === id
                ? "bg-ds-surface font-medium text-ds-ink shadow-ds-sm"
                : "text-ds-muted hover:bg-ds-surface/60 hover:text-ds-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-70" />
            {label}
            {id === "download" && downloadEnabled && (
              <span className="ml-auto rounded-ds-pill bg-ds-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-ds-info">
                Ativo
              </span>
            )}
            {id === "favoritos" && favoriteEnabled && (
              <span className="ml-auto rounded-ds-pill bg-ds-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-ds-info">
                Ativo
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-ds-hairline px-5 py-4 md:px-8">
          <h2 className="text-lg font-semibold text-ds-ink">
            {section === "geral" && "Em geral"}
            {section === "privacidade" && "Privacidade"}
            {section === "download" && "Download"}
            {section === "favoritos" && "Favoritos"}
          </h2>
          <p className="mt-0.5 text-sm text-ds-muted">
            Link público, privacidade e opções para o cliente.
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-ds-hairline px-4 py-2 md:hidden">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                "shrink-0 rounded-ds-pill px-3 py-1 text-xs font-medium",
                section === id
                  ? "bg-ds-ink text-ds-on-dark"
                  : "bg-ds-cream text-ds-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
          {error ? (
            <p className="mb-4 rounded-ds-md border border-ds-danger/30 bg-ds-danger-soft px-3 py-2 text-sm text-ds-danger">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mb-4 rounded-ds-md border border-ds-success/30 bg-ds-success-soft px-3 py-2 text-sm text-ds-success">
              Alterações salvas.
            </p>
          ) : null}

          {section === "geral" && (
            <div className="mx-auto flex max-w-xl flex-col gap-6">
              <Field
                label="URL da galeria"
                hint="Endereço único que seus clientes usarão para acessar."
              >
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-sm text-ds-muted">/g/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={panelInputCls}
                    placeholder="minha-galeria"
                  />
                </div>
              </Field>

              <Field
                label="Modo da galeria"
                hint="Seleção exibe marca d'água e bloqueia download. Entrega libera o arquivo original."
              >
                <div className="flex gap-2">
                  {(["selection", "delivery"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={modePending}
                      onClick={() => handleModeChange(mode)}
                      className={cn(
                        "rounded-ds-lg border px-4 py-2 text-sm font-medium transition-colors",
                        gallery.mode === mode
                          ? "border-ds-ink bg-ds-ink text-ds-on-dark"
                          : "border-ds-border bg-ds-surface text-ds-muted hover:border-ds-border-strong hover:text-ds-ink"
                      )}
                    >
                      {MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {section === "privacidade" && (
            <div className="mx-auto flex max-w-xl flex-col gap-6">
              <Field label="Senha de acesso" hint="Opcional. O cliente precisará informar para ver a galeria.">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setClearPassword(false);
                  }}
                  className={panelInputCls}
                  placeholder={gallery.password_hash ? "Deixe em branco para manter" : "Opcional"}
                />
                {gallery.password_hash && (
                  <label className="mt-2 flex items-center gap-2 text-xs text-ds-muted">
                    <input
                      type="checkbox"
                      checked={clearPassword}
                      onChange={(e) => {
                        setClearPassword(e.target.checked);
                        if (e.target.checked) setPassword("");
                      }}
                      className="h-4 w-4 accent-ds-accent"
                    />
                    Remover senha
                  </label>
                )}
              </Field>

              <Field label="Expiração automática" hint="Após esta data a galeria deixa de ser acessível.">
                <div className="relative max-w-xs">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={panelInputCls}
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2" />
                </div>
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt("")}
                    className="mt-2 text-xs text-ds-muted underline"
                  >
                    Remover expiração
                  </button>
                )}
              </Field>
            </div>
          )}

          {section === "download" && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-ds-card border border-ds-border bg-ds-cream/30 p-5">
                <Switch
                  id="gallery-download"
                  checked={downloadEnabled}
                  onChange={setDownloadEnabled}
                  label="Permitir download"
                />
                <p className="mt-2 text-sm text-ds-muted">
                  Quando ativo, o cliente pode baixar fotos individuais ou o pacote completo.
                </p>
              </div>
            </div>
          )}

          {section === "favoritos" && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-ds-card border border-ds-border bg-ds-cream/30 p-5">
                <Switch
                  id="gallery-favorites"
                  checked={favoriteEnabled}
                  onChange={setFavoriteEnabled}
                  label="Permitir favoritar fotos"
                />
                <p className="mt-2 text-sm text-ds-muted">
                  O cliente pode marcar fotos preferidas antes de enviar a seleção.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ds-hairline px-5 py-4 md:px-8">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-ds-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-ds-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
