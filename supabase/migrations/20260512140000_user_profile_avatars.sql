-- Foto de perfil opcional (upload); quando avatar_is_custom, o callback OAuth não sobrescreve avatar_url.

alter table public.users
  add column if not exists avatar_is_custom boolean not null default false;

comment on column public.users.avatar_is_custom is
  'True: foto enviada pelo usuário; o login OAuth não atualiza avatar_url.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  2621440,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

create policy "user_avatars_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'user-avatars');

create policy "user_avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
