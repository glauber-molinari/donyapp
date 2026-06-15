-- Blog posts públicos e controle de leitura por usuário

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  content text not null,
  cover_emoji text default '✦',
  category text not null default 'novidade',
  published boolean default false,
  notify_email boolean default false,
  notify_app boolean default true,
  email_sent_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;

create policy "Posts publicados são públicos"
  on public.blog_posts for select
  using (published = true);

-- Posts publicados por data (listagem pública)
create index blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where published = true;

-- Lookup por slug
create index blog_posts_slug_idx
  on public.blog_posts (slug);

-- Sidebar do app: posts com notify_app ativos, ordenados por data
create index blog_posts_notify_app_idx
  on public.blog_posts (notify_app, published_at desc)
  where published = true and notify_app = true;

-- ---------------------------------------------------------------------------

create table public.blog_post_reads (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.blog_posts(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (user_id, post_id)
);

alter table public.blog_post_reads enable row level security;

create policy "Usuário vê próprias leituras"
  on public.blog_post_reads for select
  using (auth.uid() = user_id);

create policy "Usuário insere própria leitura"
  on public.blog_post_reads for insert
  with check (auth.uid() = user_id);

-- Listagem de leituras por usuário (sidebar: quais posts já foram vistos)
create index blog_post_reads_user_id_idx
  on public.blog_post_reads (user_id);
