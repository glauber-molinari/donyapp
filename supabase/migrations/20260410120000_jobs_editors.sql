alter table public.jobs
add column if not exists photo_editor_id uuid null references public.users(id) on delete set null,
add column if not exists video_editor_id uuid null references public.users(id) on delete set null;

create index if not exists jobs_photo_editor_id_idx on public.jobs(photo_editor_id);
create index if not exists jobs_video_editor_id_idx on public.jobs(video_editor_id);

