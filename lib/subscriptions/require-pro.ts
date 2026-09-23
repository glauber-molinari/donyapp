import { NextResponse } from "next/server";

import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getAccountPlan(
  supabase: ServerSupabase,
  accountId: string
): Promise<"free" | "pro"> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", accountId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.plan === "pro" ? "pro" : "free";
}

/** Garante conta Pro para rotas autenticadas de recursos exclusivos. */
export async function requireProAccount(
  supabase: ServerSupabase,
  userId: string,
  featureLabel = "Este recurso"
): Promise<{ accountId: string } | { error: NextResponse }> {
  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: NextResponse.json({ error: "Conta não encontrada." }, { status: 403 }) };
  }

  const plan = await getAccountPlan(supabase, profile.account_id);
  if (plan !== "pro") {
    return {
      error: NextResponse.json(
        { error: `${featureLabel} disponível apenas para o plano PRO.` },
        { status: 403 }
      ),
    };
  }

  return { accountId: profile.account_id };
}
