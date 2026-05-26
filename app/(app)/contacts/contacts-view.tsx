"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createContact, deleteContact, updateContact } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PanelField, PanelFieldCard, panelInputCls } from "@/components/ui/side-panel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];

interface ContactsViewProps {
  contacts: Contact[];
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function whatsappUrl(phone: string) {
  return `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, "")}`;
}

export function ContactsView({ contacts }: ContactsViewProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContactRow, setDeleteContactRow] = useState<Contact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await createContact(fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setCreateOpen(false);
      form.reset();
      toast.success("Contato criado.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editContact) return;
    const fd = new FormData(e.currentTarget);
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await updateContact(editContact.id, fd);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setEditContact(null);
      toast.success("Contato atualizado.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteContactRow) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const res = await deleteContact(deleteContactRow.id);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setDeleteContactRow(null);
      toast.success("Contato excluído.");
      refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ds-ink">Contatos</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => router.push("/notes")}
          >
            Anotações
          </Button>
          <Button
            id="btn-novo-contato"
            type="button"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => {
              setErrorMessage(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo contato
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-ds-danger/20 bg-ds-danger-soft px-4 py-3 text-sm text-ds-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-ds-xl border border-ds-border bg-ds-surface py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-ds-sm placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
          aria-label="Buscar contatos"
        />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          title="Nenhum contato ainda"
          description="Cadastre clientes para vincular aos jobs de edição."
        >
          <Button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo contato
          </Button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ds-muted">
          Nenhum contato encontrado para &quot;{query.trim()}&quot;.
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-ds-xl border border-ds-border md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ds-border bg-ds-cream/90">
                  <th className="px-4 py-3 font-medium text-ds-muted">Nome</th>
                  <th className="px-4 py-3 font-medium text-ds-muted">E-mail</th>
                  <th className="px-4 py-3 font-medium text-ds-muted">Telefone</th>
                  <th className="w-40 px-4 py-3 text-right font-medium text-ds-muted">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                  >
                    <td className="px-4 py-3 font-medium text-ds-ink">
                      <button
                        type="button"
                        className="text-left underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/30"
                        onClick={() => router.push(`/contacts/${c.id}`)}
                        aria-label={`Abrir ${c.name}`}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-ds-muted">{c.email}</td>
                    <td className="px-4 py-3 text-ds-muted-2">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {c.phone?.trim() ? (
                          <a
                            href={whatsappUrl(c.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ds-success hover:bg-ds-success-soft"
                            aria-label={`WhatsApp de ${c.name}`}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Ver detalhes de ${c.name}`}
                          onClick={() => router.push(`/contacts/${c.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label={`Editar ${c.name}`}
                          onClick={() => {
                            setErrorMessage(null);
                            setEditContact(c);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-ds-danger hover:bg-ds-danger-soft hover:text-ds-danger"
                          aria-label={`Excluir ${c.name}`}
                          onClick={() => {
                            setErrorMessage(null);
                            setDeleteContactRow(c);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {filtered.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="block w-full truncate text-left font-semibold text-ds-ink underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent/30"
                      onClick={() => router.push(`/contacts/${c.id}`)}
                      aria-label={`Abrir ${c.name}`}
                    >
                      {c.name}
                    </button>
                    <p className="text-sm text-ds-muted">{c.email}</p>
                    {c.phone ? (
                      <p className="mt-1 text-sm text-ds-muted-2">{c.phone}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {c.phone?.trim() ? (
                      <a
                        href={whatsappUrl(c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ds-success hover:bg-ds-success-soft"
                        aria-label={`WhatsApp de ${c.name}`}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Ver detalhes de ${c.name}`}
                      onClick={() => router.push(`/contacts/${c.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Editar ${c.name}`}
                      onClick={() => {
                        setErrorMessage(null);
                        setEditContact(c);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-ds-danger hover:bg-ds-danger-soft"
                      aria-label={`Excluir ${c.name}`}
                      onClick={() => {
                        setErrorMessage(null);
                        setDeleteContactRow(c);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo contato"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)} disabled={isPending}>
              Fechar
            </Button>
            <Button type="submit" form="contact-create-form" size="sm" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        }
      >
        <form id="contact-create-form" className="p-5" onSubmit={handleCreate}>
          <PanelFieldCard>
            <PanelField label="Nome" htmlFor="contact-create-name" required>
              <input
                id="contact-create-name"
                name="name"
                required
                autoComplete="name"
                placeholder="Nome completo"
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="E-mail" htmlFor="contact-create-email" required>
              <input
                id="contact-create-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@exemplo.com"
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="Telefone" htmlFor="contact-create-phone">
              <input
                id="contact-create-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Opcional"
                className={panelInputCls}
              />
            </PanelField>
            <PanelField label="Observações" htmlFor="contact-create-notes" align="start">
              <textarea
                id="contact-create-notes"
                name="notes"
                rows={3}
                placeholder="Opcional"
                className={cn(panelInputCls, "resize-none")}
              />
            </PanelField>
          </PanelFieldCard>
        </form>
      </Modal>

      <Modal
        open={Boolean(editContact)}
        onClose={() => setEditContact(null)}
        title="Editar contato"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditContact(null)} disabled={isPending}>
              Fechar
            </Button>
            <Button type="submit" form="contact-edit-form" size="sm" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        }
      >
        {editContact ? (
          <form id="contact-edit-form" key={editContact.id} className="p-5" onSubmit={handleEdit}>
            <PanelFieldCard>
              <PanelField label="Nome" htmlFor="contact-edit-name" required>
                <input
                  id="contact-edit-name"
                  name="name"
                  required
                  defaultValue={editContact.name}
                  className={panelInputCls}
                />
              </PanelField>
              <PanelField label="E-mail" htmlFor="contact-edit-email" required>
                <input
                  id="contact-edit-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={editContact.email}
                  className={panelInputCls}
                />
              </PanelField>
              <PanelField label="Telefone" htmlFor="contact-edit-phone">
                <input
                  id="contact-edit-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={editContact.phone ?? ""}
                  placeholder="Opcional"
                  className={panelInputCls}
                />
              </PanelField>
              <PanelField label="Observações" htmlFor="contact-edit-notes" align="start">
                <textarea
                  id="contact-edit-notes"
                  name="notes"
                  rows={3}
                  defaultValue={editContact.notes ?? ""}
                  placeholder="Opcional"
                  className={cn(panelInputCls, "resize-none")}
                />
              </PanelField>
            </PanelFieldCard>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteContactRow)}
        onClose={() => setDeleteContactRow(null)}
        title="Excluir contato"
        size="sm"
        footer={
          deleteContactRow ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteContactRow(null)} disabled={isPending}>
                Fechar
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {deleteContactRow ? (
          <p className="p-5 text-sm text-ds-muted">
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-ds-ink">{deleteContactRow.name}</span>
            ? Esta ação não pode ser desfeita.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
