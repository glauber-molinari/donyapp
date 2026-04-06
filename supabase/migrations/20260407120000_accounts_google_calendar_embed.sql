-- URL do iframe "Incorporar calendário" (Google Agenda) — visível a todos os membros; só admin altera (RLS accounts_update_admin).

alter table public.accounts
  add column if not exists google_calendar_embed_src text;

comment on column public.accounts.google_calendar_embed_src is
  'HTTPS embed URL from Google Calendar (Integrate calendar). Example: https://calendar.google.com/calendar/embed?src=...';
