"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createContact, deleteContact, updateContact } from "./actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types/database";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];

interface ContactsViewProps {
  contacts: Contact[];
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
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-subtle"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-ds-xl border border-app-border bg-app-sidebar py-2.5 pl-10 pr-3 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20"
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
          Nenhum contato encontrado para “{query.trim()}”.
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-ds-xl border border-app-border md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-app-border bg-ds-cream/90">
                  <th className="px-4 py-3 font-medium text-ds-muted">Nome</th>
                  <th className="px-4 py-3 font-medium text-ds-muted">E-mail</th>
                  <th className="px-4 py-3 font-medium text-ds-muted">Telefone</th>
                  <th className="w-28 px-4 py-3 text-right font-medium text-ds-muted">
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
                    <td className="px-4 py-3 font-medium text-ds-ink">{c.name}</td>
                    <td className="px-4 py-3 text-ds-muted">{c.email}</td>
                    <td className="px-4 py-3 text-ds-subtle">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
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
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                    <p className="font-semibold text-ds-ink">{c.name}</p>
                    <p className="text-sm text-ds-muted">{c.email}</p>
                    {c.phone ? (
                      <p className="mt-1 text-sm text-ds-subtle">{c.phone}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
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
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
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
        size="lg"
      >
        <form className="flex flex-col gap-4" onSubmit={handleCreate}>
          <Input id="contact-create-name" name="name" label="Nome completo" required />
          <Input
            id="contact-create-email"
            name="email"
            type="email"
            label="E-mail"
            required
            autoComplete="email"
          />
          <Input
            id="contact-create-phone"
            name="phone"
            label="Telefone / WhatsApp"
            placeholder="Opcional"
          />
          <Textarea
            id="contact-create-notes"
            name="notes"
            label="Observações"
            placeholder="Opcional"
            rows={3}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editContact)}
        onClose={() => setEditContact(null)}
        title="Editar contato"
        size="lg"
      >
        {editContact ? (
          <form
            key={editContact.id}
            className="flex flex-col gap-4"
            onSubmit={handleEdit}
          >
            <Input
              id="contact-edit-name"
              name="name"
              label="Nome completo"
              required
              defaultValue={editContact.name}
            />
            <Input
              id="contact-edit-email"
              name="email"
              type="email"
              label="E-mail"
              required
              defaultValue={editContact.email}
              autoComplete="email"
            />
            <Input
              id="contact-edit-phone"
              name="phone"
              label="Telefone / WhatsApp"
              placeholder="Opcional"
              defaultValue={editContact.phone ?? ""}
            />
            <Textarea
              id="contact-edit-notes"
              name="notes"
              label="Observações"
              placeholder="Opcional"
              rows={3}
              defaultValue={editContact.notes ?? ""}
            />
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditContact(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteContactRow)}
        onClose={() => setDeleteContactRow(null)}
        title="Excluir contato"
        size="sm"
      >
        {deleteContactRow ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ds-muted">
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-ds-ink">{deleteContactRow.name}</span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteContactRow(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Excluindo…" : "Excluir"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
