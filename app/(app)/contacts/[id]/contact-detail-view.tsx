"use client";

import {
  ArrowLeft,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PanelField, PanelFieldCard, panelInputCls } from "@/components/ui/side-panel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Database, JobType } from "@/types/database";

type Contact = Database["public"]["Tables"]["contacts"]["Row"];

type JobRow = {
  id: string;
  name: string;
  type: JobType;
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
}

type TabType = "todos" | "foto" | "video" | "foto_video";

const tabConfig: { key: TabType; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "foto", label: "Foto" },
  { key: "video", label: "Vídeo" },
  { key: "foto_video", label: "Foto e Vídeo" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

export function ContactDetailView({ contact, jobs, notes }: ContactDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fotoJobs = jobs.filter((j) => j.type === "foto");
  const videoJobs = jobs.filter((j) => j.type === "video");
  const fotoVideoJobs = jobs.filter((j) => j.type === "foto_video");

  const visibleJobs =
    activeTab === "todos"
      ? jobs
      : activeTab === "foto"
        ? fotoJobs
        : activeTab === "video"
          ? videoJobs
          : fotoVideoJobs;

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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ds-ink">{contact.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ds-muted">
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
        <div className="flex shrink-0 flex-wrap gap-2">
          {contact.phone?.trim() ? (
            <a
              href={whatsappUrl(contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-ds-xl border border-ds-success/20 bg-ds-success-soft px-3 py-1.5 text-sm font-medium text-ds-success hover:bg-ds-success-soft/80"
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
          <p className="text-xs font-medium uppercase tracking-wide text-ds-muted">
            Observações
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ds-ink">{contact.notes}</p>
        </Card>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-ds-danger/20 bg-ds-danger-soft px-4 py-3 text-sm text-ds-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="grid w-fit grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total de jobs"
          value={jobs.length}
          color="text-ds-ink"
          icon={<Film className="h-4 w-4" />}
        />
        <StatCard
          label="Foto"
          value={fotoJobs.length}
          color="text-ds-accent"
          icon={<Camera className="h-4 w-4" />}
        />
        <StatCard
          label="Vídeo"
          value={videoJobs.length}
          color="text-sky-600"
          icon={<FileVideo className="h-4 w-4" />}
        />
        <StatCard
          label="Foto e Vídeo"
          value={fotoVideoJobs.length}
          color="text-amber-600"
          icon={<Film className="h-4 w-4" />}
        />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ds-ink">Jobs</h2>

        <div className="mb-4 flex gap-1 overflow-x-auto">
          {tabConfig.map((tab) => {
            const count =
              tab.key === "todos"
                ? jobs.length
                : tab.key === "foto"
                  ? fotoJobs.length
                  : tab.key === "video"
                    ? videoJobs.length
                    : fotoVideoJobs.length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-ds-ink text-ds-cream"
                    : "bg-ds-cream text-ds-muted hover:bg-ds-border hover:text-ds-ink"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-px text-xs ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-ds-border text-ds-muted-2"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {visibleJobs.length === 0 ? (
          <EmptyState
            title="Nenhum job encontrado"
            description={
              activeTab === "todos"
                ? "Este cliente ainda não tem jobs cadastrados."
                : `Nenhum job do tipo "${tabConfig.find((t) => t.key === activeTab)?.label}" para este cliente.`
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
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
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="w-32 p-3">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <p className="text-xl font-bold text-ds-ink">{value}</p>
      </div>
      <p className="mt-1.5 text-xs leading-tight text-ds-muted">{label}</p>
    </Card>
  );
}

function JobRow({ job }: { job: JobRow }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge kind="job-type" value={job.type} />
          {job.stage ? (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-ds-ink">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: job.stage.color }}
              />
              {job.stage.name}
            </span>
          ) : null}
        </div>
      </div>
      <div>
        <p className="font-medium text-ds-ink">{job.name}</p>
        {job.work_type ? (
          <p className="mt-0.5 text-xs text-ds-muted">{job.work_type.name}</p>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-1 text-xs text-ds-muted-2">
        <span>Prazo: {formatDate(job.deadline)}</span>
        {job.job_date ? <span>Data do job: {formatDate(job.job_date)}</span> : null}
        {job.stage?.is_final ? (
          <span className="font-medium text-ds-success">
            Entregue em: {formatDate(job.updated_at.slice(0, 10))}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
