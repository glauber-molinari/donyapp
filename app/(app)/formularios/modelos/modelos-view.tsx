"use client";

import { CheckCircle2, Copy, ExternalLink, FileText, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import type { FormTemplate } from "@/lib/formularios/types";

interface Props {
  templates: FormTemplate[];
}

export function ModelosView({ templates }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "";

  function copyLink(slug: string) {
    const url = `${appUrl}/formulario/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(slug);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/formularios/templates/${deletingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Modelo excluído.");
      setDeletingId(null);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir modelo.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ds-muted">
          Crie formulários públicos para captação de clientes.
        </p>
        <Link href="/formularios/modelos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo modelo
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum modelo criado"
          description="Crie seu primeiro formulário para começar a captar clientes."
        >
          <Link href="/formularios/modelos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar modelo
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-ds-xl border border-ds-border bg-ds-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ds-border bg-ds-elevated">
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">Título</th>
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">Slug</th>
                <th className="px-4 py-3 text-center font-semibold text-ds-muted">Campos</th>
                <th className="px-4 py-3 text-center font-semibold text-ds-muted">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-ds-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-ds-border last:border-0 hover:bg-ds-elevated/40">
                  <td className="px-4 py-3 font-medium text-ds-ink">{t.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-ds-elevated px-1.5 py-0.5 text-xs text-ds-muted">
                        {t.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyLink(t.slug)}
                        title="Copiar link público"
                        className="text-ds-muted-2 hover:text-ds-ink"
                      >
                        {copied === t.slug ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={`/formulario/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir formulário"
                        className="text-ds-muted-2 hover:text-ds-ink"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-ds-muted">{t.fields.length}</td>
                  <td className="px-4 py-3 text-center">
                    {t.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ds-success-soft px-2 py-0.5 text-xs font-medium text-ds-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ds-elevated px-2 py-0.5 text-xs font-medium text-ds-muted">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/formularios/modelos/${t.id}`}>
                        <button
                          type="button"
                          title="Editar"
                          className="rounded-lg p-1.5 text-ds-muted-2 hover:bg-ds-elevated hover:text-ds-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => setDeletingId(t.id)}
                        className="rounded-lg p-1.5 text-ds-muted-2 hover:bg-ds-danger-soft hover:text-ds-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Excluir modelo"
        size="sm"
      >
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-ds-muted">
            Tem certeza que deseja excluir este modelo? As submissões existentes não serão apagadas.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
