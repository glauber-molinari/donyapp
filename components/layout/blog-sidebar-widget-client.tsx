"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { markPostAsRead } from "@/lib/blog/actions";
import type { SidebarPost } from "@/lib/blog/actions";
import type { BlogCategory } from "@/types/blog";

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  novidade: "Novidade",
  tutorial: "Tutorial",
  posicionamento: "Posicionamento",
};

const CATEGORY_STYLE: Record<BlogCategory, string> = {
  novidade: "bg-ds-accent-soft text-ds-accent",
  tutorial: "bg-ds-info-soft text-ds-info",
  posicionamento: "bg-ds-elevated text-ds-ink-2",
};

export function BlogSidebarWidgetClient({ posts }: { posts: SidebarPost[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const post = posts[0];
  const extraCount = posts.length - 1;

  const handleView = () => {
    window.open(`/blog/${post.slug}`, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      await markPostAsRead(post.id);
      router.refresh();
    });
  };

  return (
    <div className="rounded-ds-card border border-ds-border bg-ds-surface p-3 text-left transition duration-ds-fast ease-out">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base leading-none text-ds-accent" aria-hidden>
          {post.cover_emoji}
        </span>
        <span
          className={`rounded-ds-pill px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLE[post.category]}`}
        >
          {CATEGORY_LABEL[post.category]}
        </span>
        {extraCount > 0 && (
          <span className="ml-auto rounded-ds-pill bg-ds-accent-soft px-2 py-0.5 text-[10px] font-semibold text-ds-accent">
            +{extraCount}
          </span>
        )}
      </div>

      <p className="mb-3 line-clamp-2 text-xs font-medium leading-snug text-ds-ink">
        {post.title}
      </p>

      <button
        type="button"
        onClick={handleView}
        className="text-xs font-semibold text-ds-accent transition duration-ds-fast ease-out hover:underline"
      >
        Ver →
      </button>
    </div>
  );
}
