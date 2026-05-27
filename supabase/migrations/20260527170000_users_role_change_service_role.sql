-- Permite convites/reparo via service role (callback e link /invite).
create or replace function public.users_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.role(), '') = 'service_role'
       or current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    if not public.is_account_admin() then
      raise exception 'apenas administradores podem alterar papéis';
    end if;
  end if;
  return new;
end;
$$;
