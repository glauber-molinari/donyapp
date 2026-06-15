import type { Metadata } from "next";

import { BlogPostCard } from "@/components/marketing/blog-post-card";
import { LegalLinks } from "@/components/legal/legal-links";
import {
  MarketingSiteHeader,
  marketingHomeAnchoredNavItems,
} from "@/components/marketing/marketing-site-header";
import { getPublishedPosts } from "@/lib/blog/actions";

export const metadata: Metadata = {
  title: "Novidades & Aprendizados | Donyapp",
  description:
    "Pós-produção, gestão de estúdio e tudo que acontece por aqui. Artigos para fotógrafos e videomakers que querem organizar melhor seu fluxo de trabalho.",
  openGraph: {
    title: "Novidades & Aprendizados | Donyapp",
    description:
      "Pós-produção, gestão de estúdio e tudo que acontece por aqui. Artigos para fotógrafos e videomakers.",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts(20);

  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink antialiased">
      <MarketingSiteHeader navItems={marketingHomeAnchoredNavItems} />

      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-[9.5rem] sm:px-6 sm:pt-[10rem] lg:px-8 lg:pt-[11.25rem]">
        <header className="mb-12 text-center">
          <h1 className="text-balance text-4xl font-black tracking-tight text-ds-ink sm:text-5xl">
            Novidades & Aprendizados
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ds-muted">
            Pós-produção, gestão de estúdio e tudo que acontece por aqui.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-20 text-center text-ds-muted">
            Nenhum artigo publicado ainda. Volte em breve.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <BlogPostCard
                key={post.id}
                slug={post.slug}
                title={post.title}
                summary={post.summary}
                cover_emoji={post.cover_emoji}
                cover_image_url={post.cover_image_url}
                category={post.category}
                published_at={post.published_at}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-ds-hairline bg-ds-cream py-8 text-center text-xs text-ds-muted-2">
        <LegalLinks linkClassName="text-ds-muted-2 text-xs" />
        <p className="mt-3">© {new Date().getFullYear()} Donyapp</p>
      </footer>
    </div>
  );
}
