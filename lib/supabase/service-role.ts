import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente com service role: ignora RLS. Use só em Route Handlers / server
 * após validar o usuário (ex.: callback OAuth com sessão trocada).
 */
export function createServiceRoleClient(): ReturnType<
  typeof createClient<Database>
> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
