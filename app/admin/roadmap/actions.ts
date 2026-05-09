"use server";

import { revalidatePath } from "next/cache";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type RoadmapColumn = "ideia" | "executando" | "aplicado";

export interface RoadmapCard {
  id: string;
  title: string;
  description: string | null;
  column: RoadmapColumn;
  position: number;
  created_at: string;
}

type ActionResult = { ok: true } | { ok: false; error: string };

async function assertAdmin(): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Acesso negado." };
  }
  return { ok: true };
}

function svc() {
  const client = createServiceRoleClient();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any;
}

export async function createCard(
  title: string,
  description: string,
  column: RoadmapColumn
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  if (!title.trim()) return { ok: false, error: "Título é obrigatório." };

  const { data: maxRow } = await svc()
    .from("admin_roadmap_cards")
    .select("position")
    .eq("column", column)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = maxRow ? maxRow.position + 1 : 0;

  const { error } = await svc()
    .from("admin_roadmap_cards")
    .insert({ title: title.trim(), description: description.trim() || null, column, position });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roadmap");
  return { ok: true };
}

export async function moveCard(id: string, column: RoadmapColumn): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const { data: maxRow } = await svc()
    .from("admin_roadmap_cards")
    .select("position")
    .eq("column", column)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = maxRow ? maxRow.position + 1 : 0;

  const { error } = await svc()
    .from("admin_roadmap_cards")
    .update({ column, position, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roadmap");
  return { ok: true };
}

export async function deleteCard(id: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;

  const { error } = await svc().from("admin_roadmap_cards").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roadmap");
  return { ok: true };
}

export async function fetchCards(): Promise<RoadmapCard[]> {
  const { data, error } = await svc()
    .from("admin_roadmap_cards")
    .select("id, title, description, column, position, created_at")
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
