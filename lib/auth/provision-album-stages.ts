import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const DEFAULT_ALBUM_STAGES: {
  position: number;
  name: string;
  color: string;
  is_final: boolean;
}[] = [
  { position: 1, name: "Em seleção", color: "bg-orange-50", is_final: false },
  { position: 2, name: "Diagramação", color: "bg-purple-50", is_final: false },
  { position: 3, name: "Aprovação do cliente", color: "bg-blue-50", is_final: false },
  { position: 4, name: "Enviado à gráfica", color: "bg-amber-50", is_final: false },
  { position: 5, name: "Conferência/Expedição", color: "bg-ds-accent/10", is_final: false },
  { position: 6, name: "Entregue", color: "bg-pink-50", is_final: true },
];

/**
 * Provisiona etapas padrão de álbum para uma conta, se ainda não existirem.
 * Chamado preguiçosamente (lazy) na primeira criação de álbum pela conta.
 */
export async function ensureAlbumStages(
  supabase: SupabaseClient<Database>,
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { count, error: countErr } = await supabase
    .from("kanban_stages")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("board_type", "album");

  if (countErr) return { ok: false, error: countErr.message };
  if ((count ?? 0) > 0) return { ok: true };

  const { error } = await supabase.from("kanban_stages").insert(
    DEFAULT_ALBUM_STAGES.map((s) => ({
      account_id: accountId,
      name: s.name,
      position: s.position,
      color: s.color,
      is_final: s.is_final,
      board_type: "album" as const,
    }))
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
