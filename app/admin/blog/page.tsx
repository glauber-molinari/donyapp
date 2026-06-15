import type { Metadata } from "next";

import { getAllPostsAdmin } from "./actions";
import { BlogListView } from "./blog-list-view";

export const metadata: Metadata = {
  title: "Blog | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage() {
  const posts = await getAllPostsAdmin();
  return <BlogListView posts={posts} />;
}
