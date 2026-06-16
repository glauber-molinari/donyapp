"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

import { saveCompanyName } from "./profile-company-name-actions";

type Props = {
  initialCompanyName: string;
  isAdmin: boolean;
};

export function ProfileCompanyNameSection({ initialCompanyName, isAdmin }: Props) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    try {
      const res = await saveCompanyName(companyName);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Nome da empresa atualizado.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-ds-xl border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          id="profile-company-name"
          label="Nome empresa"
          hint="Aparece na galeria enviada ao cliente, no rodapé e na marca d'água (quando configurada como texto)."
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={!isAdmin || saving}
          maxLength={120}
          required
        />

        {isAdmin ? (
          <div>
            <Button type="submit" size="sm" disabled={saving || !companyName.trim()}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-ds-muted">
            Apenas administradores podem alterar o nome da empresa.
          </p>
        )}
      </form>
    </div>
  );
}
