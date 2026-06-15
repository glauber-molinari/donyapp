"use server";

import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/blog";

export type SidebarPost = Pick<
  BlogPost,
  "id" | "slug" | "title" | "category" | "cover_emoji" | "published_at"
>;

export async function getPublishedPosts(limit = 20): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return data as BlogPost;
}

export async function getRecentPostsForSidebar(limit = 3): Promise<SidebarPost[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: reads } = await supabase
    .from("blog_post_reads")
    .select("post_id")
    .eq("user_id", user.id);

  const readIds = (reads ?? []).map((r) => r.post_id);

  let query = supabase
    .from("blog_posts")
    .select("id, slug, title, category, cover_emoji, published_at")
    .eq("published", true)
    .eq("notify_app", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (readIds.length > 0) {
    query = query.not("id", "in", `(${readIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as SidebarPost[];
}

export async function markPostAsRead(postId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("blog_post_reads")
    .upsert({ user_id: user.id, post_id: postId }, { ignoreDuplicates: true });

  return { ok: !error };
}

export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: reads } = await supabase
    .from("blog_post_reads")
    .select("post_id")
    .eq("user_id", user.id);

  const readIds = (reads ?? []).map((r) => r.post_id);

  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("published", true)
    .eq("notify_app", true);

  if (readIds.length > 0) {
    query = query.not("id", "in", `(${readIds.join(",")})`);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}
