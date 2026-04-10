-- Categorias (tags) e prioridade nas anotações

alter table public.contact_notes
  add column if not exists categories text[] not null default '{}'::text[];

alter table public.contact_notes
  add column if not exists priority text not null default 'none';

alter table public.contact_notes
  drop constraint if exists contact_notes_priority_check;

alter table public.contact_notes
  add constraint contact_notes_priority_check
  check (priority in ('none', 'low', 'medium', 'high'));
