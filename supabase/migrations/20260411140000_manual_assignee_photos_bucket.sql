-- Bucket público para fotos de responsáveis manuais (upload pelo app).
-- Caminho: {account_id}/{uuid}.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-assignee-photos',
  'manual-assignee-photos',
  true,
  2621440,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

create policy "manual_assignee_photos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'manual-assignee-photos');

create policy "manual_assignee_photos_insert_account"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'manual-assignee-photos'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );

create policy "manual_assignee_photos_update_account"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'manual-assignee-photos'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );

create policy "manual_assignee_photos_delete_account"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'manual-assignee-photos'
    and (storage.foldername(name))[1] = (
      select u.account_id::text
      from public.users u
      where u.id = auth.uid()
      limit 1
    )
  );
