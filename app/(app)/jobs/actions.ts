"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  collectAssigneeTokens,
  parseAssigneeToken,
} from "@/lib/job-assignee-form";
import {
  normalizeOptionalUrl,
  parseDeadline,
  parseJobType,
  parseOptionalContactId,
  parseRequiredId,
  parseProfessionalTagsFromFormData,
  parseSdCardTagsFromFormData,
} from "@/lib/validation/job";
import { FREE_MAX_ACTIVE_JOBS } from "@/lib/plan-limits";
import { normalizeOptionalText } from "@/lib/validation/contact";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getAccountContext(): Promise<
  { accountId: string; userId: string } | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return { error: "Conta não encontrada para este usuário." };
  }

  return { accountId: profile.account_id, userId: user.id };
}

async function verifyContactBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  contactId: string | null
): Promise<boolean> {
  if (!contactId) return true;
  const { data } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

async function countActiveJobsForAccount(
  supabase: ReturnType<typeof createClient>,
  accountId: string
): Promise<number> {
  const { data: stages } = await supabase
    .from("kanban_stages")
    .select("id")
    .eq("account_id", accountId)
    .eq("is_final", false);

  const ids = (stages ?? []).map((s) => s.id);
  if (ids.length === 0) return 0;

  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId)
    .in("stage_id", ids)
    .neq("job_kind", "video_edit");

  return count ?? 0;
}

async function verifyStageBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  stageId: string | null
): Promise<boolean> {
  if (!stageId) return true;
  const { data } = await supabase
    .from("kanban_stages")
    .select("id")
    .eq("id", stageId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyWorkTypeBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  workTypeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("job_work_types")
    .select("id")
    .eq("id", workTypeId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyManualAssigneeBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  assigneeId: string | null
): Promise<boolean> {
  if (!assigneeId) return true;
  const { data } = await supabase
    .from("manual_job_assignees")
    .select("id")
    .eq("id", assigneeId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

type JobAssigneeRowInsert = {
  job_id: string;
  user_id: string | null;
  manual_job_assignee_id: string | null;
  role: "photo" | "video";
};

function deriveLegacyFromTokens(photoTokens: string[], videoTokens: string[]) {
  let photo_editor_id: string | null = null;
  let photo_manual_assignee_id: string | null = null;
  let video_editor_id: string | null = null;
  let video_manual_assignee_id: string | null = null;
  for (const t of photoTokens) {
    const p = parseAssigneeToken(t);
    if (!p) continue;
    if (p.kind === "user" && !photo_editor_id) photo_editor_id = p.id;
    if (p.kind === "manual" && !photo_manual_assignee_id) photo_manual_assignee_id = p.id;
  }
  for (const t of videoTokens) {
    const p = parseAssigneeToken(t);
    if (!p) continue;
    if (p.kind === "user" && !video_editor_id) video_editor_id = p.id;
    if (p.kind === "manual" && !video_manual_assignee_id) video_manual_assignee_id = p.id;
  }
  return { photo_editor_id, photo_manual_assignee_id, video_editor_id, video_manual_assignee_id };
}

async function validateAssigneeTokens(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  tokens: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const t of tokens) {
    const p = parseAssigneeToken(t);
    if (!p) return { ok: false, error: "Responsável inválido na lista." };
    if (p.kind === "user") {
      const ok = await verifyUserBelongs(supabase, accountId, p.id);
      if (!ok) return { ok: false, error: "Um dos responsáveis (conta) é inválido." };
    } else {
      const ok = await verifyManualAssigneeBelongs(supabase, accountId, p.id);
      if (!ok) return { ok: false, error: "Um dos responsáveis é inválido." };
    }
  }
  return { ok: true };
}

async function replaceJobAssigneesForJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  photoTokens: string[],
  videoTokens: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: delErr } = await supabase.from("job_assignees").delete().eq("job_id", jobId);
  if (delErr) return { ok: false, error: delErr.message };
  const rows: JobAssigneeRowInsert[] = [];
  for (const t of photoTokens) {
    const p = parseAssigneeToken(t);
    if (!p) return { ok: false, error: "Token de responsável inválido." };
    rows.push(
      p.kind === "user"
        ? { job_id: jobId, user_id: p.id, manual_job_assignee_id: null, role: "photo" }
        : { job_id: jobId, user_id: null, manual_job_assignee_id: p.id, role: "photo" }
    );
  }
  for (const t of videoTokens) {
    const p = parseAssigneeToken(t);
    if (!p) return { ok: false, error: "Token de responsável inválido." };
    rows.push(
      p.kind === "user"
        ? { job_id: jobId, user_id: p.id, manual_job_assignee_id: null, role: "video" }
        : { job_id: jobId, user_id: null, manual_job_assignee_id: p.id, role: "video" }
    );
  }
  if (rows.length === 0) return { ok: true };
  const { error: insErr } = await supabase.from("job_assignees").insert(rows);
  if (insErr) return { ok: false, error: insErr.message };
  return { ok: true };
}

/** Próximo índice no fim da coluna (ex.: novo job ou mover sem lista completa). */
async function nextPositionAtEndOfStage(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  stageId: string,
  excludeJobId?: string
): Promise<number> {
  let q = supabase
    .from("jobs")
    .select("position")
    .eq("stage_id", stageId)
    .eq("account_id", accountId);
  if (excludeJobId) {
    q = q.neq("id", excludeJobId);
  }
  const { data } = await q.order("position", { ascending: false }).limit(1).maybeSingle();
  return (data?.position ?? -1) + 1;
}

export type KanbanColumnSync = { stageId: string; jobIdsOrdered: string[] };

/**
 * Persiste colunas e ordem dos cards (guia: reaplica position 0..n por etapa).
 */
export async function syncKanbanState(moves: KanbanColumnSync[]): Promise<ActionResult> {
  try {
    const ctx = await getAccountContext();
    if ("error" in ctx) return { ok: false, error: ctx.error };

    const supabase = createClient();

    const allIds: string[] = [];
    for (const m of moves) {
      for (const id of m.jobIdsOrdered) {
        allIds.push(id);
      }
    }
    if (new Set(allIds).size !== allIds.length) {
      return { ok: false, error: "Lista de jobs inválida (duplicado)." };
    }

    if (allIds.length > 0) {
      const { data: owned, error: ownErr } = await supabase
        .from("jobs")
        .select("id")
        .eq("account_id", ctx.accountId)
        .in("id", allIds);
      if (ownErr) return { ok: false, error: ownErr.message };
      if (!owned || owned.length !== allIds.length) {
        return { ok: false, error: "Um ou mais jobs são inválidos." };
      }
    }

    for (const { stageId, jobIdsOrdered } of moves) {
      if (jobIdsOrdered.length === 0) continue;
      const stageOk = await verifyStageBelongs(supabase, ctx.accountId, stageId);
      if (!stageOk) return { ok: false, error: "Etapa inválida." };

      for (let i = 0; i < jobIdsOrdered.length; i++) {
        const jobId = jobIdsOrdered[i];
        const { error } = await supabase
          .from("jobs")
          .update({ stage_id: stageId, position: i })
          .eq("id", jobId)
          .eq("account_id", ctx.accountId);
        if (error) {
          return { ok: false, error: error.message };
        }
      }
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath("/board");
    } catch (revalidateErr) {
      console.error("syncKanbanState: revalidatePath", revalidateErr);
    }

    return { ok: true };
  } catch (e) {
    console.error("syncKanbanState", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao sincronizar o quadro.",
    };
  }
}

type ParsedJobFields = {
  name: string;
  type: NonNullable<ReturnType<typeof parseJobType>>;
  internal_deadline: string;
  deadline: string;
  job_date: string | null;
  work_type_id: string;
  contact_id: string | null;
  notes: string | null;
  professional_photo_tags: string[];
  professional_video_tags: string[];
  delivery_link: string | null;
  stage_id: string | null;
  photo_editor_id: string | null;
  video_editor_id: string | null;
  photo_manual_assignee_id: string | null;
  video_manual_assignee_id: string | null;
  sd_card_tags: string[];
};

function parseOptionalUserId(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function parseJobForm(formData: FormData): { error: string } | ParsedJobFields {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const type = parseJobType(formData.get("type"));
  const internal_deadline = parseDeadline(formData.get("internal_deadline"));
  const deadline = parseDeadline(formData.get("deadline"));
  const jobDateRaw = formData.get("job_date");
  let job_date: string | null = null;
  if (typeof jobDateRaw === "string" && jobDateRaw.trim()) {
    const jd = parseDeadline(jobDateRaw);
    if (!jd) return { error: "Data do job inválida." };
    job_date = jd;
  }
  const contactId = parseOptionalContactId(formData.get("contact_id"));
  const notes = normalizeOptionalText(formData.get("notes"));
  const deliveryRaw = formData.get("delivery_link");
  const delivery_link = normalizeOptionalUrl(deliveryRaw);
  if (deliveryRaw && typeof deliveryRaw === "string" && deliveryRaw.trim() && !delivery_link) {
    return { error: "Link do material final deve ser uma URL http(s) válida." };
  }
  const stageIdRaw = formData.get("stage_id");
  const stage_id =
    typeof stageIdRaw === "string" && stageIdRaw.trim() ? stageIdRaw.trim() : null;

  const wt = parseRequiredId(formData.get("work_type_id"), "Selecione o tipo do job.");
  if (typeof wt !== "string") return wt;
  const work_type_id = wt;

  if (!name) return { error: "Nome do job é obrigatório." };
  if (!type) return { error: "Selecione o tipo de entrega." };
  if (!internal_deadline) return { error: "Prazo interno inválido." };
  if (!deadline) return { error: "Prazo final inválido." };

  const rawProfPhoto = parseProfessionalTagsFromFormData(formData, "professional_photo_tags");
  if ("error" in rawProfPhoto) return rawProfPhoto;
  const rawProfVideo = parseProfessionalTagsFromFormData(formData, "professional_video_tags");
  if ("error" in rawProfVideo) return rawProfVideo;

  const professional_photo_tags = type === "video" ? [] : rawProfPhoto;
  const professional_video_tags = type === "foto" ? [] : rawProfVideo;

  const photo_editor_id = parseOptionalUserId(formData.get("photo_editor_id"));
  const video_editor_id = parseOptionalUserId(formData.get("video_editor_id"));
  const photo_manual_assignee_id = parseOptionalUserId(formData.get("photo_manual_assignee_id"));
  const video_manual_assignee_id = parseOptionalUserId(formData.get("video_manual_assignee_id"));

  const sdParsed = parseSdCardTagsFromFormData(formData);
  if ("error" in sdParsed) return sdParsed;
  const sd_card_tags = sdParsed;

  return {
    name,
    type,
    internal_deadline,
    deadline,
    job_date,
    work_type_id,
    contact_id: contactId,
    notes,
    professional_photo_tags,
    professional_video_tags,
    delivery_link,
    stage_id,
    photo_editor_id,
    video_editor_id,
    photo_manual_assignee_id,
    video_manual_assignee_id,
    sd_card_tags,
  };
}

/** Card extra de edição de vídeo: só para `foto_video` (um card foto + um card vídeo no quadro). */
async function insertVideoEditChildJob(
  supabase: ReturnType<typeof createClient>,
  ctx: { accountId: string; userId: string },
  parentJobId: string,
  parsed: ParsedJobFields,
  video_editor_id: string | null,
  video_manual_assignee_id: string | null,
  stageId: string
): Promise<{ ok: true; childId: string } | { ok: false; error: string }> {
  const nextPos = await nextPositionAtEndOfStage(supabase, ctx.accountId, stageId);
  const { data: childRow, error: childErr } = await supabase
    .from("jobs")
    .insert({
      account_id: ctx.accountId,
      contact_id: parsed.contact_id,
      stage_id: stageId,
      position: nextPos,
      name: `${parsed.name} - Vídeo`,
      type: "video",
      internal_deadline: parsed.internal_deadline,
      deadline: parsed.deadline,
      job_date: parsed.job_date,
      work_type_id: parsed.work_type_id,
      notes: null,
      professional_photo_tags: [],
      professional_video_tags: [],
      delivery_link: null,
      sd_card_tags: [],
      created_by: ctx.userId,
      photo_editor_id: null,
      video_editor_id,
      photo_manual_assignee_id: null,
      video_manual_assignee_id,
      job_kind: "video_edit",
      parent_job_id: parentJobId,
    })
    .select("id")
    .maybeSingle();
  if (childErr) {
    return { ok: false, error: childErr.message };
  }
  if (!childRow?.id) {
    return { ok: false, error: "Não foi possível criar o card de vídeo." };
  }
  return { ok: true, childId: childRow.id };
}

async function verifyUserBelongs(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  userId: string | null
): Promise<boolean> {
  if (!userId) return true;
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("account_id", accountId)
    .maybeSingle();
  return Boolean(data);
}

export async function createJob(formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = parseJobForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (!parsed.stage_id) {
    return { ok: false, error: "Selecione a coluna inicial." };
  }

  const supabase = createClient();

  const contactOk = await verifyContactBelongs(supabase, ctx.accountId, parsed.contact_id);
  if (!contactOk) return { ok: false, error: "Contato inválido." };

  const workTypeOk = await verifyWorkTypeBelongs(supabase, ctx.accountId, parsed.work_type_id);
  if (!workTypeOk) return { ok: false, error: "Tipo do job inválido." };

  const stageOk = await verifyStageBelongs(supabase, ctx.accountId, parsed.stage_id);
  if (!stageOk) return { ok: false, error: "Etapa inválida." };

  let photoTok = collectAssigneeTokens(formData, "assignee_photo");
  let videoTok = collectAssigneeTokens(formData, "assignee_video");
  if (parsed.type === "foto") videoTok = [];
  if (parsed.type === "video") photoTok = [];

  const pickerN = Number((formData.get("assignee_picker_option_count") as string) || "0");
  if (pickerN > 1) {
    if (parsed.type === "foto" || parsed.type === "foto_video") {
      if (photoTok.length === 0) {
        return { ok: false, error: "Selecione ao menos um responsável pela foto." };
      }
    }
    if (parsed.type === "video" || parsed.type === "foto_video") {
      if (videoTok.length === 0) {
        return { ok: false, error: "Selecione ao menos um responsável pelo vídeo." };
      }
    }
  }

  const valPhoto = await validateAssigneeTokens(supabase, ctx.accountId, photoTok);
  if (!valPhoto.ok) return valPhoto;
  const valVideo = await validateAssigneeTokens(supabase, ctx.accountId, videoTok);
  if (!valVideo.ok) return valVideo;

  const legacyFull = deriveLegacyFromTokens(photoTok, videoTok);
  const splitFotoVideoCombo = parsed.type === "foto_video";
  const parentLegacy = splitFotoVideoCombo ? deriveLegacyFromTokens(photoTok, []) : legacyFull;
  const photo_editor_id = parentLegacy.photo_editor_id;
  const video_editor_id = parentLegacy.video_editor_id;
  const photo_manual_assignee_id = parentLegacy.photo_manual_assignee_id;
  const video_manual_assignee_id = parentLegacy.video_manual_assignee_id;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if ((sub?.plan ?? "free") === "free") {
    const activeCount = await countActiveJobsForAccount(supabase, ctx.accountId);
    if (activeCount >= FREE_MAX_ACTIVE_JOBS) {
      return {
        ok: false,
        error: `No plano Free, o limite é ${FREE_MAX_ACTIVE_JOBS} jobs ativos (fora da etapa final). Faça upgrade em Configurações → Plano ou conclua entregas.`,
      };
    }
  }

  const stageId = parsed.stage_id;
  const nextPos = await nextPositionAtEndOfStage(supabase, ctx.accountId, stageId);

  const baseRow = {
    account_id: ctx.accountId,
    contact_id: parsed.contact_id,
    stage_id: stageId,
    position: nextPos,
    name: parsed.name,
    type: splitFotoVideoCombo ? ("foto" as const) : parsed.type,
    internal_deadline: parsed.internal_deadline,
    deadline: parsed.deadline,
    job_date: parsed.job_date,
    work_type_id: parsed.work_type_id,
    notes: parsed.notes,
    professional_photo_tags: parsed.professional_photo_tags,
    professional_video_tags: parsed.professional_video_tags,
    sd_card_tags: parsed.sd_card_tags,
    delivery_link: parsed.delivery_link,
    created_by: ctx.userId,
    photo_editor_id,
    video_editor_id,
    photo_manual_assignee_id,
    video_manual_assignee_id,
    job_kind: "standard" as const,
    parent_job_id: null as string | null,
  };

  const { data: inserted, error: insErr } = await supabase
    .from("jobs")
    .insert(baseRow)
    .select("id")
    .maybeSingle();

  if (insErr) {
    return { ok: false, error: insErr.message };
  }
  if (!inserted?.id) {
    return { ok: false, error: "Não foi possível criar o job." };
  }

  const syncParent = await replaceJobAssigneesForJob(
    supabase,
    inserted.id,
    photoTok,
    splitFotoVideoCombo ? [] : videoTok
  );
  if (!syncParent.ok) return syncParent;

  if (parsed.type === "foto_video") {
    const childRes = await insertVideoEditChildJob(
      supabase,
      ctx,
      inserted.id,
      parsed,
      legacyFull.video_editor_id,
      legacyFull.video_manual_assignee_id,
      stageId
    );
    if (!childRes.ok) return childRes;
    const syncChild = await replaceJobAssigneesForJob(supabase, childRes.childId, [], videoTok);
    if (!syncChild.ok) return syncChild;
  }

  revalidatePath("/dashboard");
  revalidatePath("/board");
  return { ok: true };
}

export async function updateJob(jobId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = parseJobForm(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  if (!parsed.stage_id) {
    return { ok: false, error: "Selecione a etapa do kanban." };
  }

  const supabase = createClient();

  const contactOk = await verifyContactBelongs(supabase, ctx.accountId, parsed.contact_id);
  if (!contactOk) return { ok: false, error: "Contato inválido." };

  const workTypeOk = await verifyWorkTypeBelongs(supabase, ctx.accountId, parsed.work_type_id);
  if (!workTypeOk) return { ok: false, error: "Tipo do job inválido." };

  const stageOk = await verifyStageBelongs(supabase, ctx.accountId, parsed.stage_id);
  if (!stageOk) return { ok: false, error: "Etapa inválida." };

  const { data: existing } = await supabase
    .from("jobs")
    .select("stage_id, parent_job_id, job_kind")
    .eq("id", jobId)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Job não encontrado." };
  }

  let photoTok = collectAssigneeTokens(formData, "assignee_photo");
  let videoTok = collectAssigneeTokens(formData, "assignee_video");
  if (parsed.type === "foto") videoTok = [];
  if (parsed.type === "video") photoTok = [];

  const pickerN = Number((formData.get("assignee_picker_option_count") as string) || "0");
  if (pickerN > 1) {
    if (parsed.type === "foto" || parsed.type === "foto_video") {
      if (photoTok.length === 0) {
        return { ok: false, error: "Selecione ao menos um responsável pela foto." };
      }
    }
    if (parsed.type === "video" || parsed.type === "foto_video") {
      if (videoTok.length === 0) {
        return { ok: false, error: "Selecione ao menos um responsável pelo vídeo." };
      }
    }
  }

  const valPhoto = await validateAssigneeTokens(supabase, ctx.accountId, photoTok);
  if (!valPhoto.ok) return valPhoto;
  const valVideo = await validateAssigneeTokens(supabase, ctx.accountId, videoTok);
  if (!valVideo.ok) return valVideo;

  const legacyFull = deriveLegacyFromTokens(photoTok, videoTok);
  const splitFotoVideoCombo = parsed.type === "foto_video";
  const parentLegacy = splitFotoVideoCombo ? deriveLegacyFromTokens(photoTok, []) : legacyFull;
  const photo_editor_id = parentLegacy.photo_editor_id;
  const video_editor_id = parentLegacy.video_editor_id;
  const photo_manual_assignee_id = parentLegacy.photo_manual_assignee_id;
  const video_manual_assignee_id = parentLegacy.video_manual_assignee_id;

  const stageChanged = existing.stage_id !== parsed.stage_id;
  const nextPos = stageChanged
    ? await nextPositionAtEndOfStage(supabase, ctx.accountId, parsed.stage_id, jobId)
    : undefined;

  const { error } = await supabase
    .from("jobs")
    .update({
      contact_id: parsed.contact_id,
      stage_id: parsed.stage_id,
      ...(stageChanged && nextPos !== undefined ? { position: nextPos } : {}),
      name: parsed.name,
      type: splitFotoVideoCombo ? ("foto" as const) : parsed.type,
      internal_deadline: parsed.internal_deadline,
      deadline: parsed.deadline,
      job_date: parsed.job_date,
      work_type_id: parsed.work_type_id,
      notes: parsed.notes,
      professional_photo_tags: parsed.professional_photo_tags,
      professional_video_tags: parsed.professional_video_tags,
      sd_card_tags: parsed.sd_card_tags,
      delivery_link: parsed.delivery_link,
      photo_editor_id,
      video_editor_id,
      photo_manual_assignee_id,
      video_manual_assignee_id,
    })
    .eq("id", jobId)
    .eq("account_id", ctx.accountId);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (existing.job_kind === "standard") {
    const { data: childRows } = await supabase
      .from("jobs")
      .select("id")
      .eq("account_id", ctx.accountId)
      .eq("parent_job_id", jobId)
      .eq("job_kind", "video_edit");

    const children = childRows ?? [];

    if (parsed.type === "foto_video") {
      if (children.length === 0) {
        const childRes = await insertVideoEditChildJob(
          supabase,
          ctx,
          jobId,
          parsed,
          legacyFull.video_editor_id,
          legacyFull.video_manual_assignee_id,
          parsed.stage_id!
        );
        if (!childRes.ok) return childRes;
        const syncNewChild = await replaceJobAssigneesForJob(
          supabase,
          childRes.childId,
          [],
          videoTok
        );
        if (!syncNewChild.ok) return syncNewChild;
      } else {
        await supabase
          .from("jobs")
          .update({
            name: `${parsed.name} - Vídeo`,
            video_editor_id: legacyFull.video_editor_id,
            video_manual_assignee_id: legacyFull.video_manual_assignee_id,
            photo_manual_assignee_id: null,
          })
          .eq("id", children[0]!.id)
          .eq("account_id", ctx.accountId);
        const syncExistingChild = await replaceJobAssigneesForJob(
          supabase,
          children[0]!.id,
          [],
          videoTok
        );
        if (!syncExistingChild.ok) return syncExistingChild;
      }
    } else if (children.length > 0) {
      const { error: delErr } = await supabase
        .from("jobs")
        .delete()
        .in(
          "id",
          children.map((c) => c.id)
        )
        .eq("account_id", ctx.accountId);
      if (delErr) {
        return { ok: false, error: delErr.message };
      }
    }
  }

  const syncMain = await replaceJobAssigneesForJob(
    supabase,
    jobId,
    photoTok,
    splitFotoVideoCombo ? [] : videoTok
  );
  if (!syncMain.ok) return syncMain;

  revalidatePath("/dashboard");
  revalidatePath("/board");
  return { ok: true };
}

export async function moveJobToStage(jobId: string, stageId: string): Promise<ActionResult> {
  try {
    const ctx = await getAccountContext();
    if ("error" in ctx) return { ok: false, error: ctx.error };

    const supabase = createClient();
    const stageOk = await verifyStageBelongs(supabase, ctx.accountId, stageId);
    if (!stageOk) return { ok: false, error: "Etapa inválida." };

    const nextPos = await nextPositionAtEndOfStage(supabase, ctx.accountId, stageId, jobId);

    const { data, error } = await supabase
      .from("jobs")
      .update({ stage_id: stageId, position: nextPos })
      .eq("id", jobId)
      .eq("account_id", ctx.accountId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data) {
      return {
        ok: false,
        error:
          "Não foi possível mover o job (nenhuma linha atualizada). Verifique se o job pertence à sua conta.",
      };
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath("/board");
    } catch (revalidateErr) {
      console.error("moveJobToStage: revalidatePath", revalidateErr);
    }

    return { ok: true };
  } catch (e) {
    console.error("moveJobToStage", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro inesperado ao mover o job.",
    };
  }
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("account_id", ctx.accountId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/board");
  return { ok: true };
}

export async function updateJobClientRevision(
  jobId: string,
  revision: number
): Promise<ActionResult> {
  if (!Number.isInteger(revision) || revision < 0 || revision > 5) {
    return { ok: false, error: "Use um número de alteração entre 0 e 5." };
  }

  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ client_revision: revision })
    .eq("id", jobId)
    .eq("account_id", ctx.accountId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Job não encontrado." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/board");
  return { ok: true };
}

// ─── Job History ──────────────────────────────────────────────────────────────

export type JobHistoryEntry = {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string | null;
  created_at: string;
};

export async function getJobHistory(
  jobId: string
): Promise<{ ok: true; entries: JobHistoryEntry[] } | { ok: false; error: string }> {
  const supabase = createClient();
  const ctx = await getAccountContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const { data, error } = await supabase
    .from("job_history")
    .select("id, field, old_value, new_value, changed_by_name, created_at")
    .eq("job_id", jobId)
    .eq("account_id", ctx.accountId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false, error: error.message };
  return { ok: true, entries: (data ?? []) as JobHistoryEntry[] };
}
