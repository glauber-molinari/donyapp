"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { addJobWorkType, deleteJobWorkType } from "./work-type-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/database";

type WorkType = Database["public"]["Tables"]["job_work_types"]["Row"];

interface SettingsWorkTypesSectionProps {
  workTypes: WorkType[];
  isAdmin: boolean;
}

export function SettingsWorkTypesSection({ workTypes, isAdmin }: SettingsWorkTypesSectionProps) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...workTypes].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [workTypes]
  );

  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = newName.trim();
    if (!t) return;
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await addJobWorkType(t);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setNewName("");
      toast.success("Tipo de trabalho adicionado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await deleteJobWorkType(id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Tipo removido.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="settings-work-types-heading">
      <div>
        <h2 id="settings-work-types-heading" className="text-lg font-semibold text-ds-ink">
          Tipos de trabalho
        </h2>
        <p className="mt-1 text-sm text-ds-muted">
          Estes tipos aparecem ao criar um job no Kanban (ex.: casamento, ensaio, produto). Você pode
          adicionar quantos precisar.
        </p>
      </div>

      {!isAdmin ? (
        <p className="text-sm text-ds-muted" role="status">
          Apenas administradores podem alterar os tipos de trabalho.
        </p>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      <Card className="p-4">
        <ul className="flex flex-col gap-2">
          {sorted.map((wt) => (
            <li
              key={wt.id}
              className="flex items-center justify-between gap-3 rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2.5"
            >
              <span className="min-w-0 truncate font-medium text-ds-ink">{wt.name}</span>
              {isAdmin ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Excluir tipo ${wt.name}`}
                  disabled={pending}
                  onClick={() => handleDelete(wt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {sorted.length === 0 ? (
          <p className="mt-3 text-sm text-ds-muted">Nenhum tipo cadastrado.</p>
        ) : null}
      </Card>

      {isAdmin ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              id="new-work-type-name"
              label="Novo tipo de trabalho"
              placeholder="Ex.: Casamento, Ensaio newborn…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending || !newName.trim()}>
            Adicionar
          </Button>
        </form>
      ) : null}
    </section>
  );
}
