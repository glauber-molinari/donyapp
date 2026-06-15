import Link from "next/link";

import { BlogPostCard } from "@/components/marketing/blog-post-card";
import { getPublishedPosts } from "@/lib/blog/actions";

export async function BlogLandingSection() {
  const posts = await getPublishedPosts(3);
  if (!posts.length) return null;

  return (
    <section className="border-t border-ds-hairline bg-ds-cream py-16 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ds-ink sm:text-3xl">
              Do estúdio para você
            </h2>
            <p className="mt-1 text-sm text-ds-muted">
              Aprendizados e novidades do Donyapp.
            </p>
          </div>
          <Link
            href="/blog"
            className="shrink-0 text-sm font-medium text-ds-accent transition duration-ds-fast ease-out hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              summary={post.summary}
              cover_emoji={post.cover_emoji}
              category={post.category}
              published_at={post.published_at}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
