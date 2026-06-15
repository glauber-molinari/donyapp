export type BlogCategory = "novidade" | "tutorial" | "posicionamento";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_emoji: string;
  cover_image_url: string | null;
  category: BlogCategory;
  published: boolean;
  notify_email: boolean;
  notify_app: boolean;
  email_sent_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRead {
  user_id: string;
  post_id: string;
  read_at: string;
}
