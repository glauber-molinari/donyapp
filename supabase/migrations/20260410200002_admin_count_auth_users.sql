-- Função para contar usuários diretamente em auth.users
-- Acessível via RPC com service role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION admin_count_auth_users()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT count(*) FROM auth.users;
$$;
