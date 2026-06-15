-- Logos de marca d'água das galerias (upload pelo app; servidos via Supabase Storage).
-- Caminho: {account_id}/{uuid}.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-watermarks',
  'gallery-watermarks',
  true,
  2097152,
  array['image/png', 'image/svg+xml', 'image/webp']::text[]
)
on conflict (id) do nothing;

create policy "gallery_watermarks_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'gallery-watermarks');

create policy "gallery_watermarks_insert_account"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery-watermarks'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );

create policy "gallery_watermarks_update_account"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'gallery-watermarks'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );

create policy "gallery_watermarks_delete_account"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery-watermarks'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );
