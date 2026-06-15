import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostByIdAdmin } from "../../actions";
import { BlogPostForm } from "../../blog-post-form";

export const metadata: Metadata = {
  title: "Editar post | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminBlogEditPage({ params }: { params: { id: string } }) {
  const post = await getPostByIdAdmin(params.id);
  if (!post) notFound();
  return <BlogPostForm post={post} />;
}
