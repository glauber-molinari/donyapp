"use client";

import Image from "next/image";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import type { BlogPost } from "@/types/blog";

import { createPost, deleteCoverImage, updatePost, uploadCoverImage, type SavePostInput } from "./actions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface BlogPostFormProps {
  post?: BlogPost;
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!post);
  const [category, setCategory] = useState<BlogPost["category"]>(post?.category ?? "novidade");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_image_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState(post?.summary ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [notifyApp, setNotifyApp] = useState(post?.notify_app ?? true);
  const [notifyEmail, setNotifyEmail] = useState(post?.notify_email ?? false);
  const [showPreview, setShowPreview] = useState(false);

  const emailAlreadySent = !!post?.email_sent_at;
  const emailToggleEnabled = published && !emailAlreadySent;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadCoverImage(fd);
    setUploadingImage(false);
    if (!res.ok) { toast.error(res.error); return; }
    setCoverImageUrl(res.url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveCoverImage() {
    if (!coverImageUrl) return;
    const res = await deleteCoverImage(coverImageUrl);
    if (!res.ok) { toast.error(res.error); return; }
    setCoverImageUrl(null);
  }

  function handleSubmit() {
    if (!title.trim()) { toast.error("Informe o título."); return; }
    if (!slug.trim()) { toast.error("Informe o slug."); return; }
    if (!summary.trim()) { toast.error("Informe o resumo."); return; }
    if (!content.trim()) { toast.error("Informe o conteúdo."); return; }

    const input: SavePostInput = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      content: content.trim(),
      cover_emoji: post?.cover_emoji || "✦",
      cover_image_url: coverImageUrl,
      category,
      published,
      notify_app: notifyApp,
      notify_email: notifyEmail && emailToggleEnabled,
    };

    startTransition(async () => {
      if (post) {
        const res = await updatePost(post.id, input);
        if (!res.ok) { toast.error(res.error); return; }
        if (res.emailPending) {
          toast.info("Post salvo. O e-mail será disparado assim que o envio estiver configurado.");
        } else {
          toast.success("Post salvo.");
        }
      } else {
        const res = await createPost(input);
        if (!res.ok) { toast.error(res.error); return; }
        toast.success("Post criado.");
        router.push(`/admin/blog/${res.id}/editar`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ds-ink">
            {post ? "Editar post" : "Novo post"}
          </h2>
          {post && (
            <p className="mt-0.5 text-xs text-ds-muted-2">
              Atualizado em {formatDate(post.updated_at)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push("/admin/blog")}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ds-ink" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="h-10 rounded-ds-lg border border-ds-border bg-ds-surface px-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/25"
              placeholder="Ex: Por que começamos pela pós-produção"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ds-ink" htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="h-10 rounded-ds-lg border border-ds-border bg-ds-surface px-3 font-mono text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/25"
              placeholder="meu-post"
            />
            <p className="text-xs text-ds-muted-2">
              donyapp.com/blog/<span className="text-ds-ink">{slug || "…"}</span>
            </p>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ds-ink" htmlFor="category">
              Categoria
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogPost["category"])}
                className="h-10 w-full appearance-none rounded-ds-lg border border-ds-border bg-ds-surface pl-3 pr-8 text-sm text-ds-ink focus:outline-none focus:ring-2 focus:ring-ds-accent/25"
              >
                <option value="novidade">Novidade</option>
                <option value="tutorial">Tutorial</option>
                <option value="posicionamento">Posicionamento</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-muted-2">
                ▾
              </span>
            </div>
          </div>

          {/* Imagem de capa */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ds-ink">
                Imagem de capa
              </label>
              <span className="text-xs text-ds-muted-2">JPG, PNG ou WebP · 1200×630 px · máx 5 MB</span>
            </div>

            {coverImageUrl ? (
              <div className="relative overflow-hidden rounded-ds-lg border border-ds-border bg-ds-surface">
                <div className="relative aspect-[1200/630] w-full">
                  <Image
                    src={coverImageUrl}
                    alt="Imagem de capa"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 680px"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoverImage}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ds-ink/60 text-white transition hover:bg-ds-danger"
                  aria-label="Remover imagem"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-ds-lg border border-dashed border-ds-border bg-ds-surface text-sm text-ds-muted-2 transition hover:border-ds-border-strong hover:bg-ds-elevated hover:text-ds-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingImage ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-ds-border border-t-ds-accent" />
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 20.25h18M16.5 6.75h.008v.008h-.008V6.75Z" />
                    </svg>
                    <span>Clique para adicionar imagem de capa</span>
                    <span className="text-xs">Proporção ideal: 1200 × 630 px</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleImageChange}
            />
          </div>

          {/* Resumo */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ds-ink" htmlFor="summary">
                Resumo
              </label>
              <span
                className={`text-xs ${summary.length > 160 ? "text-ds-danger" : "text-ds-muted-2"}`}
              >
                {summary.length}/160
              </span>
            </div>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={200}
              rows={3}
              className="rounded-ds-lg border border-ds-border bg-ds-surface px-3 py-2 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/25"
              placeholder="Descrição curta exibida nos cards e no meta description (máx 160 caracteres)"
            />
          </div>

          {/* Conteúdo */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ds-ink" htmlFor="content">
                Conteúdo (Markdown)
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs font-medium text-ds-accent hover:underline"
              >
                {showPreview ? "Editar" : "Pré-visualizar"}
              </button>
            </div>

            {showPreview ? (
              <div className="min-h-[320px] rounded-ds-lg border border-ds-border bg-ds-surface px-4 py-3">
                <div className="prose prose-stone max-w-none prose-headings:font-bold prose-headings:text-ds-ink prose-p:text-ds-muted prose-p:leading-relaxed prose-a:text-ds-accent prose-strong:text-ds-ink prose-code:rounded prose-code:bg-ds-hairline prose-code:px-1 prose-li:text-ds-muted">
                  <ReactMarkdown>{content || "_Sem conteúdo ainda._"}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="rounded-ds-lg border border-ds-border bg-ds-surface px-3 py-2 font-mono text-sm text-ds-ink placeholder:text-ds-muted-2 focus:outline-none focus:ring-2 focus:ring-ds-accent/25"
                placeholder="## Título&#10;&#10;Escreva o conteúdo em Markdown..."
              />
            )}
          </div>
        </div>

        {/* Coluna lateral — publicação */}
        <div className="flex flex-col gap-4 lg:w-72">
          <div className="rounded-ds-card border border-ds-border bg-ds-surface p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
              Publicação
            </p>
            <div className="flex flex-col gap-4">
              <Switch
                checked={published}
                onChange={setPublished}
                label="Publicado"
                hint="Visível no blog público"
              />
              <Switch
                checked={notifyApp}
                onChange={setNotifyApp}
                label="Notificar no app"
                hint="Aparece no widget do sidebar"
              />
              <div>
                <Switch
                  checked={notifyEmail && emailToggleEnabled}
                  onChange={(v) => setNotifyEmail(v)}
                  disabled={!emailToggleEnabled}
                  label="Disparar e-mail"
                  hint={
                    emailAlreadySent
                      ? `E-mail enviado em ${formatDate(post!.email_sent_at!)}`
                      : !published
                        ? "Disponível após publicar"
                        : "Envia para todos os usuários (único disparo)"
                  }
                />
              </div>
            </div>
          </div>

          {post && (
            <div className="rounded-ds-card border border-ds-border bg-ds-surface p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                Informações
              </p>
              <dl className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ds-muted">Criado em</dt>
                  <dd className="text-right text-ds-ink">{formatDate(post.created_at)}</dd>
                </div>
                {post.published_at && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ds-muted">Publicado em</dt>
                    <dd className="text-right text-ds-ink">{formatDate(post.published_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-ds-muted">Slug</dt>
                  <dd className="truncate text-right font-mono text-ds-ink">{post.slug}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
