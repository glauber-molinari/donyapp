-- Policies adicionais para o primeiro login (provisionNewStudio): avaliam o perfil
-- via EXISTS legível sob RLS, em paralelo às policies que usam current_account_id /
-- is_account_admin(), para evitar falhas intermitentes de provisionamento.

create policy "account_members_insert_bootstrap"
  on public.account_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'admin'
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.account_id = account_id
        and u.role = 'admin'
    )
  );

create policy "kanban_stages_insert_bootstrap"
  on public.kanban_stages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.account_id = account_id
        and u.role = 'admin'
    )
  );

create policy "subscriptions_insert_bootstrap"
  on public.subscriptions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.account_id = account_id
    )
  );
