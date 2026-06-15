import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { LegalLinks } from "@/components/legal/legal-links";
import {
  MarketingSiteHeader,
  marketingHomeAnchoredNavItems,
} from "@/components/marketing/marketing-site-header";
import { getPostBySlug } from "@/lib/blog/actions";
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
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export const dynamic = "force-dynamic";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://donyapp.com").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};

  const canonical = `${appUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | Donyapp`,
    description: post.summary,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      url: canonical,
      siteName: "Donyapp",
      ...(post.cover_image_url && {
        images: [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }],
      }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const canonical = `${appUrl}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: canonical,
    author: {
      "@type": "Organization",
      name: "Dony",
      url: appUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Dony",
      url: appUrl,
    },
  };

  // Escapa `<` para evitar quebra antecipada da tag <script> via </script> no conteúdo.
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <div className="min-h-screen bg-ds-cream text-ds-ink antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <MarketingSiteHeader navItems={marketingHomeAnchoredNavItems} />

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-[9.5rem] sm:px-6 sm:pt-[10rem] lg:pt-[11.25rem]">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-ds-muted">
          <Link href="/blog" className="hover:text-ds-ink">
            Blog
          </Link>
          <span aria-hidden>›</span>
          <span className="line-clamp-1 text-ds-ink-2">{post.title}</span>
        </nav>

        {/* Capa */}
        {post.cover_image_url ? (
          <div className="mb-8 overflow-hidden rounded-ds-card">
            <div className="relative aspect-[1200/630] w-full">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 672px) 100vw, 672px"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <span className="text-6xl leading-none" aria-hidden>
              {post.cover_emoji}
            </span>
          </div>
        )}

        {/* Título e meta */}
        <header className="mb-10">
          <h1 className="text-balance text-3xl font-black leading-tight tracking-tight text-ds-ink sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-ds-pill px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[post.category]}`}
            >
              {CATEGORY_LABEL[post.category]}
            </span>
            {post.published_at && (
              <span className="text-xs uppercase tracking-wide text-ds-muted-2">
                {formatDate(post.published_at)}
              </span>
            )}
          </div>
        </header>

        {/* Conteúdo Markdown */}
        <div className="prose prose-stone max-w-none prose-headings:font-bold prose-headings:text-ds-ink prose-p:text-ds-muted prose-p:leading-relaxed prose-a:text-ds-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-ds-ink prose-code:rounded prose-code:bg-ds-hairline prose-code:px-1 prose-code:py-0.5 prose-code:text-ds-ink-2 prose-pre:rounded-ds-card prose-pre:border prose-pre:border-ds-border prose-pre:bg-ds-surface prose-li:text-ds-muted prose-hr:border-ds-hairline">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* CTA final */}
        <div className="mt-16 rounded-ds-card border border-ds-border bg-ds-surface p-8 text-center">
          <p className="text-lg font-semibold text-ds-ink">Organize sua pós-produção</p>
          <p className="mt-2 text-sm text-ds-muted">
            Kanban de edições, prazos e clientes num fluxo pensado para estúdios e freelancers.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-ds-lg bg-ds-accent px-6 py-3 text-sm font-semibold text-white transition duration-ds-fast ease-out hover:brightness-95"
          >
            Começar grátis
          </Link>
        </div>
      </main>

      <footer className="border-t border-ds-hairline bg-ds-cream py-8 text-center text-xs text-ds-muted-2">
        <LegalLinks linkClassName="text-ds-muted-2 text-xs" />
        <p className="mt-3">© {new Date().getFullYear()} Donyapp</p>
      </footer>
    </div>
  );
}
