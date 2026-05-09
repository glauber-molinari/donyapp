"use client";

import { Eye, EyeOff, Inbox, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import type { FormField, SubmissionWithTemplate } from "@/lib/formularios/types";

interface Props {
  submissions: SubmissionWithTemplate[];
  templateMap: Record<string, FormField[]>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detectName(fields: FormField[], data: Record<string, string | string[]>): string {
  const namePatterns = ["nome completo", "nome", "seu nome"];
  for (const f of fields) {
    const norm = f.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (namePatterns.some((p) => norm.includes(p))) {
      const val = data[f.id];
      if (val) return Array.isArray(val) ? val.join(", ") : val;
    }
  }
  return "—";
}

function detectEmail(fields: FormField[], data: Record<string, string | string[]>): string {
  for (const f of fields) {
    if (f.type === "email") {
      const val = data[f.id];
      if (val) return Array.isArray(val) ? val.join(", ") : val;
    }
  }
  return "—";
}

export function RecebidosView({ submissions, templateMap }: Props) {
  const router = useRouter();
  const [filterViewed, setFilterViewed] = useState<"all" | "unread" | "read">("all");
  const [filterTemplate, setFilterTemplate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (filterViewed === "unread" && s.viewed) return false;
      if (filterViewed === "read" && !s.viewed) return false;
      if (filterTemplate && s.form_template_id !== filterTemplate) return false;
      return true;
    });
  }, [submissions, filterViewed, filterTemplate]);

  const uniqueTemplates = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of submissions) {
      if (s.form_template_id && s.form_templates?.title && !seen.has(s.form_template_id)) {
        seen.set(s.form_template_id, s.form_templates.title);
      }
    }
    return Array.from(seen.entries());
  }, [submissions]);

  const openSubmission = filtered.find((s) => s.id === openId) ?? null;
  const openFields: FormField[] =
    openSubmission?.form_template_id ? (templateMap[openSubmission.form_template_id] ?? []) : [];
  const openData = (openSubmission?.data ?? {}) as Record<string, string | string[]>;

  async function markViewed(id: string) {
    await fetch(`/api/formularios/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewed: true }),
    });
    router.refresh();
  }

  function handleOpen(id: string) {
    setOpenId(id);
    const sub = submissions.find((s) => s.id === id);
    if (sub && !sub.viewed) markViewed(id);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/formularios/submissions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${selected.size} formulário(s) excluído(s).`);
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Erro ao excluir formulários.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDeleteOne(id: string) {
    setIsPending(true);
    try {
      const res = await fetch(`/api/formularios/submissions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Formulário excluído.");
      if (openId === id) setOpenId(null);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-ds-muted">
          {submissions.length} formulário(s) no total ·{" "}
          {submissions.filter((s) => !s.viewed).length} não visualizada(s)
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-ds-xl border border-ds-border text-sm">
          {(["all", "unread", "read"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilterViewed(v)}
              className={`px-3 py-1.5 first:rounded-l-ds-xl last:rounded-r-ds-xl ${
                filterViewed === v
                  ? "bg-ds-ink text-white"
                  : "bg-ds-surface text-ds-muted hover:bg-ds-elevated"
              }`}
            >
              {v === "all" ? "Todas" : v === "unread" ? "Não lidas" : "Lidas"}
            </button>
          ))}
        </div>

        {uniqueTemplates.length > 1 && (
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="rounded-ds-xl border border-ds-border bg-ds-surface px-3 py-1.5 text-sm text-ds-muted"
          >
            <option value="">Todos os formulários</option>
            {uniqueTemplates.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        )}

        {selected.size > 0 && (
          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={isPending}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir {selected.size}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhum formulário encontrado"
          description="Quando clientes preencherem seu formulário, as respostas aparecerão aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-ds-xl border border-ds-border bg-ds-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ds-border bg-ds-elevated">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-ds-border accent-ds-accent"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">Data</th>
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">Formulário</th>
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-ds-muted">E-mail</th>
                <th className="px-4 py-3 text-center font-semibold text-ds-muted">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-ds-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const fields = sub.form_template_id
                  ? (templateMap[sub.form_template_id] ?? [])
                  : [];
                const data = (sub.data ?? {}) as Record<string, string | string[]>;
                const name = detectName(fields, data);
                const email = detectEmail(fields, data);
                return (
                  <tr
                    key={sub.id}
                    className={`cursor-pointer border-b border-ds-border last:border-0 hover:bg-ds-elevated/40 ${
                      !sub.viewed ? "bg-ds-accent/5" : ""
                    }`}
                    onClick={() => handleOpen(sub.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        className="h-4 w-4 rounded border-ds-border accent-ds-accent"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ds-muted">
                      {formatDate(sub.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-ds-muted">
                      {sub.form_templates?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-ds-ink">{name}</td>
                    <td className="px-4 py-3 text-ds-muted">{email}</td>
                    <td className="px-4 py-3 text-center">
                      {sub.viewed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ds-elevated px-2 py-0.5 text-xs text-ds-muted">
                          <Eye className="h-3 w-3" />
                          Lido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ds-accent/15 px-2 py-0.5 text-xs font-medium text-ds-accent">
                          <EyeOff className="h-3 w-3" />
                          Novo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(sub.id)}
                        className="rounded p-1.5 text-ds-subtle hover:bg-red-50 hover:text-red-500"
                        title="Excluir"
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer / Modal de detalhe */}
      <Modal
        open={!!openId && !!openSubmission}
        onClose={() => setOpenId(null)}
        title={openSubmission?.form_templates?.title ?? "Formulário"}
        size="lg"
      >
        {openSubmission && (
          <SubmissionDetail
            submission={openSubmission}
            fields={openFields}
            data={openData}
            onDelete={() => handleDeleteOne(openSubmission.id)}
            isPending={isPending}
          />
        )}
      </Modal>
    </div>
  );
}

interface SubmissionDetailProps {
  submission: SubmissionWithTemplate;
  fields: FormField[];
  data: Record<string, string | string[]>;
  onDelete: () => void;
  isPending: boolean;
}

function SubmissionDetail({ submission, fields, data, onDelete, isPending }: SubmissionDetailProps) {
  return (
    <div className="space-y-4 p-5">
      <p className="text-xs text-ds-muted">
        Recebido em {formatDate(submission.submitted_at)}
        {submission.linked_job_id && (
          <span className="ml-3 rounded bg-green-100 px-2 py-0.5 font-medium text-green-700">
            Vinculado a um trabalho
          </span>
        )}
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-ds-muted">
          Template do formulário não encontrado. Dados brutos:
        </p>
      ) : null}

      <div className="space-y-3">
        {fields.map((f) => {
          const val = data[f.id];
          if (val === undefined || val === null || val === "") return null;
          const display = Array.isArray(val) ? val.join(", ") : val;
          return (
            <div key={f.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">
                {f.label}
              </p>
              <p className="mt-0.5 text-sm text-ds-ink">{display}</p>
            </div>
          );
        })}

        {fields.length === 0 &&
          Object.entries(data).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs font-mono text-ds-muted">{key}</p>
              <p className="mt-0.5 text-sm text-ds-ink">
                {Array.isArray(val) ? val.join(", ") : String(val)}
              </p>
            </div>
          ))}
      </div>

      <div className="border-t border-ds-border pt-4">
        <Button variant="danger" size="sm" onClick={onDelete} disabled={isPending}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Excluir formulário
        </Button>
      </div>
    </div>
  );
}
