-- admin_count_auth_users lê auth.users com SECURITY DEFINER.
-- EXECUTE padrão (PUBLIC/anon) deixava a métrica acessível pela Data API.
REVOKE ALL ON FUNCTION public.admin_count_auth_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_count_auth_users() FROM anon;
REVOKE ALL ON FUNCTION public.admin_count_auth_users() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_count_auth_users() TO postgres;
GRANT EXECUTE ON FUNCTION public.admin_count_auth_users() TO service_role;
