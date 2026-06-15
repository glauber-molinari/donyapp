"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type { BlogPost } from "@/types/blog";

import { deletePost, togglePublished } from "./actions";

const CATEGORY_LABEL = {
  novidade: "Novidade",
  tutorial: "Tutorial",
  posicionamento: "Posicionamento",
} as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function BlogListView({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ds-ink">Posts do blog</h2>
          <p className="mt-0.5 text-sm text-ds-muted">{posts.length} posts no total</p>
        </div>
        <Link href="/admin/blog/novo">
          <Button size="sm">Novo post</Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-ds-muted">Nenhum post criado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-ds-card border border-ds-border bg-ds-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ds-hairline">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ds-muted-2">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-hairline">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PostRow({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleTogglePublished() {
    startTransition(async () => {
      const res = await togglePublished(post.id, !post.published);
      if (res.ok) {
        toast.success(post.published ? "Post despublicado." : "Post publicado.");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir "${post.title}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (res.ok) {
        toast.success("Post excluído.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <tr className="group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none" aria-hidden>
            {post.cover_emoji}
          </span>
          <Link
            href={`/admin/blog/${post.id}/editar`}
            className="max-w-[260px] truncate font-medium text-ds-ink hover:text-ds-accent"
          >
            {post.title}
          </Link>
        </div>
      </td>
      <td className="px-4 py-3 text-ds-muted">{CATEGORY_LABEL[post.category]}</td>
      <td className="px-4 py-3">
        {post.published ? (
          <span className="inline-flex items-center gap-1 rounded-ds-pill bg-ds-success-soft px-2.5 py-0.5 text-xs font-semibold text-ds-success">
            Publicado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-ds-pill bg-ds-hairline px-2.5 py-0.5 text-xs font-semibold text-ds-muted">
            Rascunho
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-ds-muted">
        {formatDate(post.published_at ?? post.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/blog/${post.id}/editar`}>
            <Button size="sm" variant="secondary">
              Editar
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleTogglePublished}
            disabled={isPending}
          >
            {post.published ? "Despublicar" : "Publicar"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={isPending}
          >
            Excluir
          </Button>
        </div>
      </td>
    </tr>
  );
}
