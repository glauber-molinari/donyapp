"use client";

import {
  ArrowLeft,
  BookImage,
  Camera,
  FileVideo,
  Film,
  Mail,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteContact, updateContact } from "../actions";
import { ProximityPill } from "@/components/app/deadline-proximity";
import { Avatar } from "@/components/ui/avatar";
import { Badge, SemanticBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PanelField, PanelFieldCard, panelInputCls } from "@/components/ui/side-panel";
import { formatDatePt } from "@/lib/job-display";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BoardType, Database, JobType } from "@/types/database";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

type JobRow = {
  id: string;
  name: string;
  type: JobType;
  board_type: BoardType;
  deadline: string;
  internal_deadline: string;
  job_date: string | null;
  delivery_link: string | null;
  created_at: string;
  updated_at: string;
  stage: { id: string; name: string; color: string; is_final: boolean } | null;
  work_type: { id: string; name: string } | null;
};

type NoteRow = {
  id: string;
  title: string | null;
  content: string;
  categories: string[];
  priority: string;
  created_at: string;
  job: { id: string; name: string } | null;
};

interface ContactDetailViewProps {
  contact: Contact;
  jobs: JobRow[];
  notes: NoteRow[];
  albumBoardEnabled: boolean;
}

type TabType = "todos" | "foto" | "video" | "foto_video" | "album";

const baseTabs: { key: TabType; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "foto", label: "Foto" },
  { key: "video", label: "Vídeo" },
  { key: "foto_video", label: "Foto e Vídeo" },
];

const albumTab: { key: TabType; label: string } = { key: "album", label: "Álbum" };

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://web.whatsapp.com/send?phone=${digits}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ContactDetailView({
  contact,
  jobs,
  notes,
  albumBoardEnabled,
}: ContactDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [editOpen, setEditOpen] = useState(false);

  function handleTabChange(key: TabType) {
    setActiveTab(key);
    setPage(1);
  }
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Álbuns são uma categoria à parte: as contagens por tipo somam apenas jobs
  // de edição, e o Total soma edição + álbuns (= jobs.length).
  const edicaoJobs = jobs.filter((j) => j.board_type !== "album");
  const albumJobs = jobs.filter((j) => j.board_type === "album");
  const fotoJobs = edicaoJobs.filter((j) => j.type === "foto");
  const videoJobs = edicaoJobs.filter((j) => j.type === "video");
  const fotoVideoJobs = edicaoJobs.filter((j) => j.type === "foto_video");

  const tabs = albumBoardEnabled ? [...baseTabs, albumTab] : baseTabs;

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const countForTab = (key: TabType) =>
    key === "todos"
      ? jobs.length
      : key === "foto"
        ? fotoJobs.length
        : key === "video"
          ? videoJobs.length
          : key === "foto_video"
            ? fotoVideoJobs.length
            : albumJobs.length;

  const allVisibleJobs =
    activeTab === "todos"
      ? jobs
      : activeTab === "foto"
        ? fotoJobs
        : activeTab === "video"
          ? videoJobs
          : activeTab === "foto_video"
            ? fotoVideoJobs
            : albumJobs;

  const totalItems = allVisibleJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visibleJobs = allVisibleJobs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await updateContact(contact.id, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setEditOpen(false);
      toast.success("Contato atualizado.");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await deleteContact(contact.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      toast.success("Contato excluído.");
      router.push("/contacts");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-sm text-ds-muted hover:text-ds-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar para Contatos
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={contact.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-ds-ink">{contact.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ds-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {contact.email}
              </span>
              {contact.phone?.trim() ? (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {contact.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {contact.phone?.trim() ? (
            <a
              href={whatsappUrl(contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-ds-lg border border-ds-success/20 bg-ds-success-soft px-3 text-xs font-medium text-ds-success transition-colors duration-ds-fast ease-out hover:bg-ds-success hover:text-white"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setErrorMessage(null);
              setEditOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-ds-danger hover:bg-ds-danger-soft hover:text-ds-danger"
            onClick={() => {
              setErrorMessage(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Excluir
          </Button>
        </div>
      </div>

      {contact.notes?.trim() ? (
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-2">
            Observações
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ds-ink">{contact.notes}</p>
        </Card>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-ds-xl border border-ds-danger/20 bg-ds-danger-soft px-4 py-3 text-sm text-ds-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <div
        className={cn(
          "grid grid-cols-2 gap-3",
          albumBoardEnabled ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"
        )}
      >
        <StatCard
          label="Total de jobs"
          value={jobs.length}
          tint="bg-ds-hairline text-ds-ink"
          icon={<Film className="h-4 w-4" />}
        />
        <StatCard
          label="Foto"
          value={fotoJobs.length}
          tint="bg-ds-accent-soft text-ds-accent"
          icon={<Camera className="h-4 w-4" />}
        />
        <StatCard
          label="Vídeo"
          value={videoJobs.length}
          tint="bg-ds-info-soft text-ds-info"
          icon={<FileVideo className="h-4 w-4" />}
        />
        <StatCard
          label="Foto e Vídeo"
          value={fotoVideoJobs.length}
          tint="bg-ds-warn-soft text-ds-warn"
          icon={<Film className="h-4 w-4" />}
        />
        {albumBoardEnabled ? (
          <StatCard
            label="Álbuns"
            value={albumJobs.length}
            tint="bg-ds-warn-soft text-ds-warn"
            icon={<BookImage className="h-4 w-4" />}
          />
        ) : null}
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ds-ink">Jobs</h2>

        <div className="mb-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const count = countForTab(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-ds-pill px-3 py-1 text-sm font-medium transition-colors duration-ds-fast ease-out",
                  activeTab === tab.key
                    ? "bg-ds-ink text-ds-on-dark"
                    : "border border-ds-border bg-ds-surface text-ds-muted hover:text-ds-ink"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-ds-pill px-1.5 py-px text-xs",
                    activeTab === tab.key
                      ? "bg-ds-on-dark/20 text-ds-on-dark"
                      : "bg-ds-hairline text-ds-muted-2"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {allVisibleJobs.length === 0 ? (
          <EmptyState
            title="Nenhum job encontrado"
            description={
              activeTab === "todos"
                ? "Este cliente ainda não tem jobs cadastrados."
                : `Nenhum job do tipo "${tabs.find((t) => t.key === activeTab)?.label}" para este cliente.`
            }
          />
        ) : (
          <Card className="p-4">
            <div className="flex flex-col gap-4">
              {/* Desktop: tabela densa */}
              <div className="hidden overflow-hidden rounded-ds-xl border border-ds-border lg:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ds-border bg-ds-cream/90">
                      <th className="px-4 py-3 font-medium text-ds-muted">Job</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Trabalho</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Etapa</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Prazo</th>
                      <th className="px-4 py-3 font-medium text-ds-muted">Data do job</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-medium text-ds-ink underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/30"
                          >
                            {job.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {job.work_type ? (
                              <span className="text-xs text-ds-muted">
                                {job.work_type.name}
                              </span>
                            ) : null}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge kind="job-type" value={job.type} />
                              {job.board_type === "album" ? (
                                <Badge kind="job-type" value="album" />
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.stage ? (
                            <span className="inline-flex items-center gap-1.5 text-ds-muted">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: job.stage.color }}
                              />
                              {job.stage.name}
                            </span>
                          ) : (
                            <span className="text-ds-muted-2">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {job.stage?.is_final ? (
                            <SemanticBadge tone="success" dot>
                              Entregue {formatDatePt(job.updated_at.slice(0, 10))}
                            </SemanticBadge>
                          ) : (
                            <ProximityPill deadline={job.deadline} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-ds-muted">
                          {job.job_date ? formatDatePt(job.job_date) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards enxutos */}
              <div className="flex flex-col gap-3 lg:hidden">
                {visibleJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-semibold text-ds-ink underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/30"
                        >
                          {job.name}
                        </Link>
                        {job.work_type ? (
                          <p className="mt-0.5 text-xs text-ds-muted">{job.work_type.name}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge kind="job-type" value={job.type} />
                          {job.board_type === "album" ? (
                            <Badge kind="job-type" value="album" />
                          ) : null}
                          {job.stage ? (
                            <span className="inline-flex items-center gap-1.5 rounded-ds-pill bg-ds-hairline px-2 py-0.5 text-xs font-medium text-ds-ink">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: job.stage.color }}
                              />
                              {job.stage.name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {job.stage?.is_final ? (
                          <SemanticBadge tone="success" dot>
                            Entregue
                          </SemanticBadge>
                        ) : (
                          <ProximityPill deadline={job.deadline} />
                        )}
                      </div>
                    </div>
                    {job.job_date ? (
                      <p className="mt-3 text-xs text-ds-muted-2">
                        Data do job: {formatDatePt(job.job_date)}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ds-muted-2">
                    Mostrando{" "}
                    <span className="font-medium text-ds-ink">
                      {(safePage - 1) * PAGE_SIZE + 1}–
                      {Math.min(totalItems, safePage * PAGE_SIZE)}
                    </span>{" "}
                    de <span className="font-medium text-ds-ink">{totalItems}</span>
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="text-xs text-ds-muted tabular-nums">
                      Página{" "}
                      <span className="font-medium text-ds-ink">{safePage}</span> de{" "}
                      <span className="font-medium text-ds-ink">{totalPages}</span>
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ds-ink">
          Anotações
          <span className="ml-2 text-sm font-normal text-ds-muted">({notes.length})</span>
        </h2>

        {notes.length === 0 ? (
          <EmptyState
            title="Nenhuma anotação"
            description="Anotações vinculadas a este contato aparecerão aqui."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Card className="flex h-full cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-ds-cream/60">
                  <div className="flex items-start justify-between gap-2">
                    <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-ds-muted-2" aria-hidden />
                    <p className="shrink-0 text-xs text-ds-muted-2">
                      {new Date(note.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ds-ink">
                      {note.title?.trim() || "Sem título"}
                    </p>
                    {note.job ? (
                      <p className="mt-1 truncate text-xs text-ds-muted">
                        Job: {note.job.name}
                      </p>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar contato"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)} disabled={isPending}>
              Fechar
            </Button>
            <Button type="submit" form="detail-edit-form" size="sm" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        }
      >
        <form id="detail-edit-form" key={contact.id} className="p-5" onSubmit={handleEdit}>
          <PanelFieldCard>
            <PanelField label="Nome" htmlFor="detail-edit-name" required>
              <input
                id="detail-edit-name"
                name="name"
                required
                defaultValue={contact.name}
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="E-mail" htmlFor="detail-edit-email" required>
              <input
                id="detail-edit-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={contact.email}
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="Telefone" htmlFor="detail-edit-phone">
              <input
                id="detail-edit-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={contact.phone ?? ""}
                placeholder="Opcional"
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="Observações" htmlFor="detail-edit-notes" align="start">
              <textarea
                id="detail-edit-notes"
                name="notes"
                rows={3}
                defaultValue={contact.notes ?? ""}
                placeholder="Opcional"
                className={cn(panelInputCls, "resize-none")}
              />
            </PanelField>
          </PanelFieldCard>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir contato"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Fechar
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
        }
      >
        <div className="p-5">
          <p className="text-sm text-ds-muted">
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-ds-ink">{contact.name}</span>? Esta ação não
            pode ser desfeita.
          </p>
          {errorMessage ? (
            <p className="mt-2 text-sm text-ds-danger">{errorMessage}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  tint,
  icon,
}: {
  label: string;
  value: number;
  tint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-lg",
          tint
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-ds-ink">{value}</p>
        <p className="mt-1 text-xs leading-tight text-ds-muted">{label}</p>
      </div>
    </Card>
  );
}

