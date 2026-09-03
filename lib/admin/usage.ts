import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import type { Database, JobType, Plan } from "@/types/database";

const FETCH_CAP = 20_000;
const TOP_N = 5;

export type AdminUsageLeaderRow = {
  accountId: string;
  studioName: string;
  plan: Plan | null;
  jobsTotal: number;
  jobs7d: number;
  jobs30d: number;
  jobsTouched30d: number;
  jobsInProgress: number;
  lastJobAt: string | null;
  accountCreatedAt: string;
};

export type AdminAdoptionRow = {
  key: string;
  label: string;
  hint: string;
  used: number;
};

export type AdminUsageSnapshot = {
  jobsTotal: number;
  jobsCreated7d: number;
  jobsCreated30d: number;
  jobsTouched7d: number;
  jobsTouched30d: number;
  jobsInProgress: number;
  jobsFinished: number;
  jobsWithContact: number;
  avgJobsPerActiveAccount: number;
  accountsWithJobs: number;
  accountsWithJobs7d: number;
  accountsWithJobs30d: number;
  accountsNeverJob: number;
  dormant30d: number;
  active7d: number;
  active30d: number;
  stickiness: number | null;
  jobsByType: Record<JobType, number>;
  jobsAlbumBoard: number;
  jobsEditBoard: number;
  contactsTotal: number;
  tasksTotal: number;
  tasksDone: number;
  tasksCreated30d: number;
  accountsWithTasks: number;
  formsTotal: number;
  formsActive: number;
  formSubmissions: number;
  formSubmissions30d: number;
  accountsWithForms: number;
  galleriesTotal: number;
  galleriesPublished: number;
  galleryPhotos: number;
  gallerySelections: number;
  accountsWithGalleries: number;
  pendingInvitations: number;
  topByJobs: AdminUsageLeaderRow[];
  topByJobs30d: AdminUsageLeaderRow[];
  adoption: AdminAdoptionRow[];
  accountsWithMembers: number;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function countSetInMembers(set: Set<string>, members: Set<string>): number {
  let n = 0;
  set.forEach((id) => {
    if (members.has(id)) n += 1;
  });
  return n;
}

export async function fetchAdminUsageSnapshot(
  db: SupabaseClient<Database>
): Promise<AdminUsageSnapshot> {
  noStore();

  const t7 = isoDaysAgo(7);
  const t30 = isoDaysAgo(30);
  const nowIso = new Date().toISOString();

  const [
    jobsRes,
    stagesRes,
    galleriesRes,
    photosRes,
    selectionsRes,
    tasksRes,
    formsRes,
    formSubsRes,
    gcalRes,
    accountsRes,
    subsRes,
    usersRes,
    contactsRes,
    invitesRes,
  ] = await Promise.all([
    db
      .from("jobs")
      .select("account_id, created_at, updated_at, type, board_type, stage_id, contact_id")
      .limit(FETCH_CAP),
    db.from("kanban_stages").select("id, is_final").limit(FETCH_CAP),
    db.from("galleries").select("account_id, status, created_at").limit(FETCH_CAP),
    db.from("gallery_photos").select("*", { count: "exact", head: true }),
    db.from("gallery_selections").select("*", { count: "exact", head: true }),
    db.from("tasks").select("account_id, status, created_at").limit(FETCH_CAP),
    db.from("form_templates").select("account_id, active").limit(FETCH_CAP),
    db.from("form_submissions").select("account_id, submitted_at").limit(FETCH_CAP),
    db.from("account_google_calendar").select("account_id").limit(FETCH_CAP),
    db
      .from("accounts")
      .select(
        "id, name, created_at, album_board_enabled, zapi_sender_connected, watermark_logo_url, whatsapp_notifications_enabled"
      )
      .limit(FETCH_CAP),
    db.from("subscriptions").select("account_id, plan, status").limit(FETCH_CAP),
    db.from("users").select("account_id").not("account_id", "is", null).limit(FETCH_CAP),
    db.from("contacts").select("*", { count: "exact", head: true }),
    db
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", nowIso),
  ]);

  const jobs = jobsRes.data ?? [];
  const galleries = galleriesRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const forms = formsRes.data ?? [];
  const formSubs = formSubsRes.data ?? [];
  const accounts = accountsRes.data ?? [];
  const users = usersRes.data ?? [];

  const finalStages = new Set(
    (stagesRes.data ?? []).filter((s) => s.is_final).map((s) => s.id)
  );

  const memberCountByAccount = new Map<string, number>();
  for (const u of users) {
    if (!u.account_id) continue;
    memberCountByAccount.set(u.account_id, (memberCountByAccount.get(u.account_id) ?? 0) + 1);
  }

  const accountsWithMembersSet = new Set(memberCountByAccount.keys());
  const accountsWithMembers = accountsWithMembersSet.size;

  const planByAccount = new Map<string, Plan>();
  for (const s of subsRes.data ?? []) {
    if (s.status === "active" && s.plan === "pro") {
      planByAccount.set(s.account_id, "pro");
    } else if (!planByAccount.has(s.account_id)) {
      planByAccount.set(s.account_id, s.plan);
    }
  }

  type Agg = {
    total: number;
    d7: number;
    d30: number;
    touched30: number;
    inProgress: number;
    lastJobAt: string | null;
  };
  const byAccount = new Map<string, Agg>();

  const jobsByType: Record<JobType, number> = { foto: 0, video: 0, foto_video: 0 };
  let jobsInProgress = 0;
  let jobsFinished = 0;
  let jobsWithContact = 0;
  let jobsCreated7d = 0;
  let jobsCreated30d = 0;
  let jobsTouched7d = 0;
  let jobsTouched30d = 0;
  let jobsAlbumBoard = 0;
  let jobsEditBoard = 0;

  const activeJob7 = new Set<string>();
  const activeJob30 = new Set<string>();
  const activeAny7 = new Set<string>();
  const activeAny30 = new Set<string>();

  for (const job of jobs) {
    const finished = Boolean(job.stage_id && finalStages.has(job.stage_id));
    if (finished) jobsFinished += 1;
    else jobsInProgress += 1;
    if (job.contact_id) jobsWithContact += 1;
    jobsByType[job.type] += 1;
    if (job.board_type === "album") jobsAlbumBoard += 1;
    else jobsEditBoard += 1;

    const created = job.created_at;
    const updated = job.updated_at || job.created_at;
    const created7 = created >= t7;
    const created30 = created >= t30;
    const touched7 = updated >= t7;
    const touched30 = updated >= t30;
    if (created7) jobsCreated7d += 1;
    if (created30) jobsCreated30d += 1;
    if (touched7) {
      jobsTouched7d += 1;
      activeJob7.add(job.account_id);
      activeAny7.add(job.account_id);
    }
    if (touched30) {
      jobsTouched30d += 1;
      activeJob30.add(job.account_id);
      activeAny30.add(job.account_id);
    }

    const prev = byAccount.get(job.account_id) ?? {
      total: 0,
      d7: 0,
      d30: 0,
      touched30: 0,
      inProgress: 0,
      lastJobAt: null as string | null,
    };
    prev.total += 1;
    if (created7) prev.d7 += 1;
    if (created30) prev.d30 += 1;
    if (touched30) prev.touched30 += 1;
    if (!finished) prev.inProgress += 1;
    if (!prev.lastJobAt || updated > prev.lastJobAt) prev.lastJobAt = updated;
    byAccount.set(job.account_id, prev);
  }

  for (const g of galleries) {
    if (g.created_at >= t7) activeAny7.add(g.account_id);
    if (g.created_at >= t30) activeAny30.add(g.account_id);
  }
  for (const t of tasks) {
    if (t.created_at >= t7) activeAny7.add(t.account_id);
    if (t.created_at >= t30) activeAny30.add(t.account_id);
  }
  for (const s of formSubs) {
    if (s.submitted_at >= t7) activeAny7.add(s.account_id);
    if (s.submitted_at >= t30) activeAny30.add(s.account_id);
  }

  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const toRow = (accountId: string, agg: Agg): AdminUsageLeaderRow | null => {
    const acc = accountById.get(accountId);
    if (!acc) return null;
    return {
      accountId,
      studioName: acc.name.trim() || "Estúdio sem nome",
      plan: planByAccount.get(accountId) ?? null,
      jobsTotal: agg.total,
      jobs7d: agg.d7,
      jobs30d: agg.d30,
      jobsTouched30d: agg.touched30,
      jobsInProgress: agg.inProgress,
      lastJobAt: agg.lastJobAt,
      accountCreatedAt: acc.created_at,
    };
  };

  const ranked: AdminUsageLeaderRow[] = [];
  let accountsWithJobsAndMembers = 0;
  byAccount.forEach((agg, id) => {
    if (accountsWithMembersSet.has(id)) accountsWithJobsAndMembers += 1;
    const row = toRow(id, agg);
    if (row) ranked.push(row);
  });

  const topByJobs = ranked.slice().sort((a, b) => b.jobsTotal - a.jobsTotal).slice(0, TOP_N);
  const topByJobs30d = ranked
    .slice()
    .filter((r) => r.jobsTouched30d > 0)
    .sort((a, b) => b.jobsTouched30d - a.jobsTouched30d || b.jobsTotal - a.jobsTotal)
    .slice(0, TOP_N);

  const accountsWithJobs = byAccount.size;
  const accountsNeverJob = Math.max(0, accountsWithMembers - accountsWithJobs);
  const dormant30d = Math.max(0, accountsWithMembers - activeJob30.size);

  const gcalAccounts = new Set((gcalRes.data ?? []).map((r) => r.account_id));
  const formAccounts = new Set(forms.map((f) => f.account_id));
  const taskAccounts = new Set(tasks.map((t) => t.account_id));
  const galleryAccounts = new Set(galleries.map((g) => g.account_id));

  let teamAccounts = 0;
  let calendarAccounts = 0;
  let whatsappConnected = 0;
  let whatsappNotify = 0;
  let watermarkAccounts = 0;
  let albumBoardAccounts = 0;

  for (const acc of accounts) {
    if (!accountsWithMembersSet.has(acc.id)) continue;
    if ((memberCountByAccount.get(acc.id) ?? 0) > 1) teamAccounts += 1;
    if (gcalAccounts.has(acc.id)) calendarAccounts += 1;
    if (acc.zapi_sender_connected) whatsappConnected += 1;
    if (acc.whatsapp_notifications_enabled) whatsappNotify += 1;
    if (acc.watermark_logo_url) watermarkAccounts += 1;
    if (acc.album_board_enabled) albumBoardAccounts += 1;
  }

  const adoption: AdminAdoptionRow[] = [
    {
      key: "jobs",
      label: "Kanban (pelo menos 1 job)",
      hint: "Criou um job alguma vez",
      used: accountsWithJobsAndMembers,
    },
    {
      key: "jobs30",
      label: "Job nos últimos 30 dias",
      hint: "Criou ou mexeu em um job no mês",
      used: countSetInMembers(activeJob30, accountsWithMembersSet),
    },
    {
      key: "team",
      label: "Equipe (2+ pessoas)",
      hint: "Convidou alguém para a conta",
      used: teamAccounts,
    },
    {
      key: "calendar",
      label: "Google Agenda",
      hint: "OAuth conectado",
      used: calendarAccounts,
    },
    {
      key: "forms",
      label: "Formulário",
      hint: "Criou pelo menos um formulário",
      used: countSetInMembers(formAccounts, accountsWithMembersSet),
    },
    {
      key: "tasks",
      label: "Tarefas",
      hint: "Criou pelo menos uma tarefa",
      used: countSetInMembers(taskAccounts, accountsWithMembersSet),
    },
    {
      key: "whatsapp",
      label: "WhatsApp (Z-API)",
      hint: "Instância marcada como conectada",
      used: whatsappConnected,
    },
    {
      key: "whatsapp-notify",
      label: "Avisos no WhatsApp",
      hint: "Notificações ligadas na conta",
      used: whatsappNotify,
    },
    {
      key: "album",
      label: "Quadro de álbum",
      hint: "Recurso ligado nas configurações",
      used: albumBoardAccounts,
    },
    {
      key: "watermark",
      label: "Logo da marca d'água",
      hint: "Enviou um arquivo de logo",
      used: watermarkAccounts,
    },
    {
      key: "galleries",
      label: "Galeria (histórico)",
      hint: "Criou galeria; o recurso público está fora do ar",
      used: countSetInMembers(galleryAccounts, accountsWithMembersSet),
    },
  ];

  const tasksDone = tasks.filter((t) => t.status === "feito").length;
  const tasksCreated30d = tasks.filter((t) => t.created_at >= t30).length;
  const formSubmissions30d = formSubs.filter((s) => s.submitted_at >= t30).length;

  const avgJobsPerActiveAccount =
    accountsWithJobs > 0 ? jobs.length / accountsWithJobs : 0;

  const active7d = countSetInMembers(activeAny7, accountsWithMembersSet);
  const active30d = countSetInMembers(activeAny30, accountsWithMembersSet);
  const stickiness = active30d > 0 ? active7d / active30d : null;

  return {
    jobsTotal: jobs.length,
    jobsCreated7d,
    jobsCreated30d,
    jobsTouched7d,
    jobsTouched30d,
    jobsInProgress,
    jobsFinished,
    jobsWithContact,
    avgJobsPerActiveAccount,
    accountsWithJobs,
    accountsWithJobs7d: activeJob7.size,
    accountsWithJobs30d: activeJob30.size,
    accountsNeverJob,
    dormant30d,
    active7d,
    active30d,
    stickiness,
    jobsByType,
    jobsAlbumBoard,
    jobsEditBoard,
    contactsTotal: contactsRes.count ?? 0,
    tasksTotal: tasks.length,
    tasksDone,
    tasksCreated30d,
    accountsWithTasks: taskAccounts.size,
    formsTotal: forms.length,
    formsActive: forms.filter((f) => f.active).length,
    formSubmissions: formSubs.length,
    formSubmissions30d,
    accountsWithForms: formAccounts.size,
    galleriesTotal: galleries.length,
    galleriesPublished: galleries.filter((g) => g.status === "published").length,
    galleryPhotos: photosRes.count ?? 0,
    gallerySelections: selectionsRes.count ?? 0,
    accountsWithGalleries: galleryAccounts.size,
    pendingInvitations: invitesRes.count ?? 0,
    topByJobs,
    topByJobs30d,
    adoption,
    accountsWithMembers,
  };
}
