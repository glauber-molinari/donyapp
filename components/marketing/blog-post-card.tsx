import Image from "next/image";
import Link from "next/link";

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

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface BlogPostCardProps {
  slug: string;
  title: string;
  summary: string;
  cover_emoji: string;
  cover_image_url?: string | null;
  category: BlogCategory;
  published_at: string | null;
}

export function BlogPostCard({
  slug,
  title,
  summary,
  cover_emoji,
  cover_image_url,
  category,
  published_at,
}: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-ds-card border border-ds-border bg-ds-surface transition duration-ds-fast ease-out hover:border-ds-border-strong hover:shadow-ds-sm"
    >
      {cover_image_url ? (
        <div className="relative aspect-[1200/630] w-full overflow-hidden bg-ds-elevated">
          <Image
            src={cover_image_url}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[1200/630] w-full items-center justify-center bg-ds-elevated">
          <span className="text-5xl leading-none" aria-hidden>{cover_emoji}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          {!cover_image_url && (
            <span className="text-xl leading-none" aria-hidden>{cover_emoji}</span>
          )}
          <span
            className={`rounded-ds-pill px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[category]}`}
          >
            {CATEGORY_LABEL[category]}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-balance text-base font-semibold leading-snug text-ds-ink transition duration-ds-fast group-hover:text-ds-accent">
            {title}
          </h2>
          <p className="line-clamp-2 text-sm leading-relaxed text-ds-muted">{summary}</p>
        </div>

        {published_at && (
          <p className="text-xs uppercase tracking-wide text-ds-muted-2">
            {formatDate(published_at)}
          </p>
        )}
      </div>
    </Link>
  );
}
