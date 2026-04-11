"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  addManualJobAssignee,
  deleteManualJobAssignee,
  updateManualJobAssignee,
} from "./manual-assignee-actions";
import { ManualAssigneePhotoField } from "./manual-assignee-photo-field";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import type { Database } from "@/types/database";

type ManualAssignee = Database["public"]["Tables"]["manual_job_assignees"]["Row"];

export function SettingsManualAssigneesSection({
  assignees,
  isAdmin,
  accountUserCount,
}: {
  assignees: ManualAssignee[];
  isAdmin: boolean;
  accountUserCount: number;
}) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...assignees].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    [assignees]
  );

  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ManualAssignee | null>(null);
  const [deleteRow, setDeleteRow] = useState<ManualAssignee | null>(null);
  const [addFormKey, setAddFormKey] = useState(0);

  const soloAccount = accountUserCount <= 1;

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await addManualJobAssignee(fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      setAddFormKey((k) => k + 1);
      toast.success("Responsável adicionado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleEditSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editRow) return;
    const fd = new FormData(e.currentTarget);
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await updateManualJobAssignee(editRow.id, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setEditRow(null);
      toast.success("Responsável atualizado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteRow) return;
    setErrorMessage(null);
    setPending(true);
    try {
      const res = await deleteManualJobAssignee(deleteRow.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setDeleteRow(null);
      toast.success("Responsável removido.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="settings-manual-assignees-heading">
      <div>
        <h2 id="settings-manual-assignees-heading" className="text-lg font-semibold text-ds-ink">
          Responsáveis manuais
        </h2>
        <p className="mt-1 text-sm text-ds-muted">
          Cadastre quem trabalha nos jobs quando só existe um usuário na conta. Esses nomes aparecem
          ao escolher responsável na criação do job (foto e vídeo).
        </p>
      </div>

      {!soloAccount ? (
        <p className="rounded-ds-xl border border-ds-border bg-ds-cream/50 px-4 py-3 text-sm text-ds-muted">
          Com mais de um usuário na conta, use{" "}
          <strong className="text-ds-ink">Configurações → Equipe</strong> para convidar membros e
          atribuir responsáveis pelos usuários do sistema. O cadastro manual fica desativado.
        </p>
      ) : null}

      {!isAdmin ? (
        <p className="text-sm text-ds-muted" role="status">
          Apenas administradores podem alterar responsáveis manuais.
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

      {soloAccount ? (
        <Card className="p-4">
          <ul className="flex flex-col gap-2">
            {sorted.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-2.5"
              >
                <Avatar src={a.photo_url} name={a.name} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ds-ink">{a.name}</p>
                  <p className="truncate text-xs text-ds-subtle">{a.email}</p>
                </div>
                {isAdmin ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Editar ${a.name}`}
                      disabled={pending}
                      onClick={() => {
                        setEditRow(a);
                        setErrorMessage(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Excluir ${a.name}`}
                      disabled={pending}
                      onClick={() => {
                        setDeleteRow(a);
                        setErrorMessage(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {sorted.length === 0 ? (
            <p className="mt-3 text-sm text-ds-muted">Nenhum responsável cadastrado ainda.</p>
          ) : null}
        </Card>
      ) : null}

      {isAdmin && soloAccount ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ds-ink">Novo responsável</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id="manual-name" name="name" label="Nome" placeholder="Nome completo" required />
            <Input
              id="manual-email"
              name="email"
              type="email"
              label="E-mail"
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <ManualAssigneePhotoField key={addFormKey} resetKey={String(addFormKey)} disabled={pending} />
          <div>
            <Button type="submit" disabled={pending}>
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar
            </Button>
          </div>
        </form>
      ) : null}

      <Modal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Editar responsável"
        size="md"
      >
        {editRow ? (
          <form className="flex flex-col gap-4" onSubmit={handleEditSave}>
            <Input
              id="edit-manual-name"
              name="name"
              label="Nome"
              defaultValue={editRow.name}
              required
            />
            <Input
              id="edit-manual-email"
              name="email"
              type="email"
              label="E-mail"
              defaultValue={editRow.email}
              required
            />
            <ManualAssigneePhotoField
              key={editRow.id}
              resetKey={editRow.id}
              existingUrl={editRow.photo_url}
              showClearHidden
              disabled={pending}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setEditRow(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Salvar
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteRow)}
        onClose={() => setDeleteRow(null)}
        title="Excluir responsável"
        size="sm"
      >
        {deleteRow ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ds-muted">
              Remover <span className="font-medium text-ds-ink">{deleteRow.name}</span> da lista? Jobs
              que usam este responsável perderão essa atribuição.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDeleteRow(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
                Excluir
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
