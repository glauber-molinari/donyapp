import { getRecentPostsForSidebar } from "@/lib/blog/actions";
import { BlogSidebarWidgetClient } from "@/components/layout/blog-sidebar-widget-client";

export async function BlogSidebarWidget() {
  const posts = await getRecentPostsForSidebar(3);
  if (!posts.length) return null;
  return <BlogSidebarWidgetClient posts={posts} />;
}
