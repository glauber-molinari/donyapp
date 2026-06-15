"use server";

import { revalidatePath } from "next/cache";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { BlogCategory, BlogPost } from "@/types/blog";

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Acesso negado." };
  }
  return { ok: true };
}

function svc() {
  const client = createServiceRoleClient();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any;
}

export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];

  const { data, error } = await svc()
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as BlogPost[];
}

export async function getPostByIdAdmin(id: string): Promise<BlogPost | null> {
  const auth = await assertAdmin();
  if (!auth.ok) return null;

  const { data, error } = await svc()
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

export interface SavePostInput {
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_emoji: string;
  cover_image_url: string | null;
  category: BlogCategory;
  published: boolean;
  notify_app: boolean;
  notify_email: boolean;
}

export async function createPost(
  input: SavePostInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const now = new Date().toISOString();
  const { data, error } = await svc()
    .from("blog_posts")
    .insert({
      ...input,
      published_at: input.published ? now : null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true, id: data.id };
}

export async function updatePost(
  id: string,
  input: SavePostInput,
): Promise<ActionResult & { emailPending?: boolean }> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const existing = await getPostByIdAdmin(id);
  if (!existing) return { ok: false, error: "Post não encontrado." };

  const wasPublished = existing.published;
  const now = new Date().toISOString();

  const { error } = await svc()
    .from("blog_posts")
    .update({
      ...input,
      // Define published_at na primeira publicação; não sobrescreve se já estava publicado.
      published_at:
        input.published && !wasPublished
          ? now
          : existing.published_at,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}/editar`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${input.slug}`);
  revalidatePath("/");

  // E-mail de notificação: sendBlogPostEmail(id) — será chamado aqui na etapa 8
  // Condição: input.notify_email === true && existing.email_sent_at === null
  const emailPending = input.notify_email && !existing.email_sent_at;

  return { ok: true, emailPending };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const { error } = await svc().from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true };
}

export async function uploadCoverImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Nenhum arquivo enviado." };

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Formato inválido. Use JPG, PNG ou WebP." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Imagem muito grande. Limite: 5 MB." };
  }

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await svc()
    .storage.from("blog-covers")
    .upload(fileName, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { ok: false, error: error.message };

  const { data: { publicUrl } } = svc().storage.from("blog-covers").getPublicUrl(fileName);

  return { ok: true, url: publicUrl };
}

export async function deleteCoverImage(url: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const prefix = `${supabaseUrl}/storage/v1/object/public/blog-covers/`;
  if (!url.startsWith(prefix)) return { ok: false, error: "URL inválida." };

  const fileName = url.slice(prefix.length);
  const { error } = await svc().storage.from("blog-covers").remove([fileName]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function togglePublished(id: string, published: boolean): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const existing = await getPostByIdAdmin(id);
  if (!existing) return { ok: false, error: "Post não encontrado." };

  const now = new Date().toISOString();
  const { error } = await svc()
    .from("blog_posts")
    .update({
      published,
      published_at: published && !existing.published_at ? now : existing.published_at,
      updated_at: now,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true };
}
