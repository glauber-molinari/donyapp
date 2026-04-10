"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isNotePriority, textFromHtml, type NotePriority } from "@/lib/notes/note-utils";
import { normalizeOptionalText } from "@/lib/validation/contact";

type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateNoteResult = { ok: true; id: string } | { ok: false; error: string };

async function getAccountContext(): Promise<
  { accountId: string; userId: string } | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: "Conta não encontrada para este usuário." };
  }

  return { accountId: profile.account_id, userId: user.id };
}

async function verifyContactBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyJobBelongsToContact(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  jobId: string | null,
  contactId: string
): Promise<boolean> {
  if (!jobId) return true;
  const { data } = await supabase
    .from("jobs")
    .select("id, contact_id")
    .eq("id", jobId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!data) return false;
  return data.contact_id === contactId;
}

function parseRequiredString(fd: FormData, key: string): string {
  return ((fd.get(key) as string) ?? "").trim();
}

function parseOptionalId(fd: FormData, key: string): string | null {
  const raw = ((fd.get(key) as string) ?? "").trim();
  return raw ? raw : null;
}

function parseCategoriesJson(fd: FormData): string[] {
  const raw = fd.get("categories_json");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    for (const x of parsed) {
      if (typeof x !== "string") continue;
      const t = x.trim();
      if (t && !out.includes(t)) out.push(t);
      if (out.length >= 16) break;
    }
    return out;
  } catch {
    return [];
  }
}

function parsePriorityField(fd: FormData): NotePriority {
  const raw = ((fd.get("priority") as string) ?? "").trim();
  if (isNotePriority(raw)) return raw;
  return "none";
}

export async function createNote(formData: FormData): Promise<CreateNoteResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const contactId = parseRequiredString(formData, "contact_id");
  const jobId = parseOptionalId(formData, "job_id");
  const title = normalizeOptionalText(formData.get("title"));
  const content = parseRequiredString(formData, "content");
  const categories = parseCategoriesJson(formData);
  const priority = parsePriorityField(formData);

  if (!contactId) return { ok: false, error: "Selecione um cliente." };
  if (!textFromHtml(content)) return { ok: false, error: "O conteúdo da nota é obrigatório." };

  const supabase = createClient();

  const contactOk = await verifyContactBelongs(supabase, ctx.accountId, contactId);
  if (!contactOk) return { ok: false, error: "Cliente inválido." };

  const jobOk = await verifyJobBelongsToContact(supabase, ctx.accountId, jobId, contactId);
  if (!jobOk) return { ok: false, error: "Job inválido para este cliente." };

  const { data, error } = await supabase
    .from("contact_notes")
    .insert({
      account_id: ctx.accountId,
      contact_id: contactId,
      job_id: jobId,
      title,
      content,
      categories,
      priority,
      created_by: ctx.userId,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data?.id) return { ok: false, error: "Não foi possível criar a nota." };

  revalidatePath("/notes");
  revalidatePath(`/notes/${data.id}`);
  return { ok: true, id: data.id };
}

export async function updateNote(noteId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const contactId = parseRequiredString(formData, "contact_id");
  const jobId = parseOptionalId(formData, "job_id");
  const title = normalizeOptionalText(formData.get("title"));
  const content = parseRequiredString(formData, "content");
  const categories = parseCategoriesJson(formData);
  const priority = parsePriorityField(formData);

  if (!contactId) return { ok: false, error: "Selecione um cliente." };
  if (!textFromHtml(content)) return { ok: false, error: "O conteúdo da nota é obrigatório." };

  const supabase = createClient();

  const contactOk = await verifyContactBelongs(supabase, ctx.accountId, contactId);
  if (!contactOk) return { ok: false, error: "Cliente inválido." };

  const jobOk = await verifyJobBelongsToContact(supabase, ctx.accountId, jobId, contactId);
  if (!jobOk) return { ok: false, error: "Job inválido para este cliente." };

  const { error } = await supabase
    .from("contact_notes")
    .update({
      contact_id: contactId,
      job_id: jobId,
      title,
      content,
      categories,
      priority,
    })
    .eq("id", noteId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return { ok: true };
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("contact_notes")
    .delete()
    .eq("id", noteId)
    .eq("account_id", ctx.accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return { ok: true };
}
