// Server-only: createClient() importa next/headers, então este módulo nunca é
// empacotado em Client Components (o build falha se tentar). Não precisa do
// pacote "server-only".
import { createClient } from "@/lib/supabase/server";

import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";

/**
 * Resolve uma feature flag no servidor (Server Components / Server Actions).
 *
 * Ordem de resolução:
 *  1. Linha em public.feature_flags (override global em runtime, sem redeploy).
 *  2. ENV do registro (FEATURE_FLAGS[key].envVar) — fallback por ambiente.
 *  3. false (default seguro: feature escondida).
 *
 * Para gating POR CONTA (ex.: liberar só para alguns clientes), use uma coluna
 * dedicada na tabela accounts — como accounts.album_board_enabled — em vez desta
 * flag global.
 */
export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (data) return data.enabled;
  } catch {
    /* Sem sessão/sem banco: cai no fallback de ENV. */
  }

  return truthy(process.env[FEATURE_FLAGS[key].envVar]);
}

function truthy(value: string | undefined): boolean {
  return value === "true" || value === "1";
}
