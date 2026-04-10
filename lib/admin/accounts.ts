import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export type AdminAccountRow = {
  id: string;
  name: string;
  created_at: string;
  subscription: SubscriptionRow | null;
  memberCount: number;
  ownerEmail: string | null;
};

function firstSubscription(
  raw: SubscriptionRow | SubscriptionRow[] | null
): SubscriptionRow | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function fetchAdminAccountsWithSubscriptions(
  db: SupabaseClient<Database>,
  opts?: { search?: string; limit?: number }
): Promise<AdminAccountRow[]> {
  const limit = opts?.limit ?? 400;
  const search = opts?.search?.trim();

  let q = db
    .from("accounts")
    .select(
      `
      id,
      name,
      created_at,
      subscriptions (
        plan,
        status,
        current_period_ends_at,
        trial_ends_at,
        extra_users,
        asaas_subscription_id,
        created_at,
        updated_at
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    q = q.ilike("name", `%${search}%`);
  }

  const { data: accounts, error: accErr } = await q;
  if (accErr || !accounts?.length) {
    return [];
  }

  const ids = accounts.map((a) => a.id);
  const { data: usersRows } = await db
    .from("users")
    .select("account_id, email, role")
    .in("account_id", ids);

  const countByAccount = new Map<string, number>();
  const adminEmailByAccount = new Map<string, string>();

  for (const row of usersRows ?? []) {
    if (!row.account_id) continue;
    countByAccount.set(row.account_id, (countByAccount.get(row.account_id) ?? 0) + 1);
    // Pega o e-mail do primeiro admin encontrado (ou qualquer membro se não houver admin)
    if (row.role === "admin" || !adminEmailByAccount.has(row.account_id)) {
      if (row.email) adminEmailByAccount.set(row.account_id, row.email);
    }
  }

  return accounts
    .map((a) => ({
      id: a.id,
      name: a.name,
      created_at: a.created_at,
      subscription: firstSubscription(
        a.subscriptions as unknown as SubscriptionRow | SubscriptionRow[] | null
      ),
      memberCount: countByAccount.get(a.id) ?? 0,
      ownerEmail: adminEmailByAccount.get(a.id) ?? null,
    }))
    // Exclui contas sem nenhum usuário em public.users — não existem mais no Supabase Auth
    .filter((a) => a.memberCount > 0);
}
