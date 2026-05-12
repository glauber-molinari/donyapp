"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

import { clearCustomProfileAvatar, uploadProfileAvatar } from "./profile-avatar-actions";

type Props = {
  displayName: string;
  email: string;
  avatarSrc: string | null;
  avatarIsCustom: boolean;
  hasOauthAvatar: boolean;
};

export function ProfileAvatarSection({
  displayName,
  email,
  avatarSrc,
  avatarIsCustom,
  hasOauthAvatar,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("photo", file);
      const res = await uploadProfileAvatar(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Foto atualizada.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function onClearCustom() {
    setClearing(true);
    try {
      const res = await clearCustomProfileAvatar();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(hasOauthAvatar ? "Voltamos a usar a foto da sua conta Google." : "Foto personalizada removida.");
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-ds-xl border border-app-border bg-app-sidebar p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <Avatar src={avatarSrc} name={displayName} size="lg" />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label="Enviar nova foto de perfil"
          onChange={onFileChange}
          disabled={uploading}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-ds-ink">{displayName}</p>
          <p className="truncate text-sm text-ds-muted">{email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Enviando…" : "Alterar foto"}
          </Button>
          {avatarIsCustom ? (
            <Button type="button" variant="ghost" size="sm" disabled={clearing} onClick={onClearCustom}>
              {clearing
                ? "Removendo…"
                : hasOauthAvatar
                  ? "Usar foto do Google"
                  : "Remover foto enviada"}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-ds-muted">JPG, PNG, WebP ou GIF · até 2,5 MB</p>
      </div>
    </div>
  );
}
