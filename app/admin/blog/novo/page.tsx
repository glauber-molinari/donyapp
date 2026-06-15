import type { Metadata } from "next";

import { BlogPostForm } from "../blog-post-form";

export const metadata: Metadata = {
  title: "Novo post | Admin",
  robots: { index: false, follow: false },
};

export default function AdminBlogNovoPage() {
  return <BlogPostForm />;
}
