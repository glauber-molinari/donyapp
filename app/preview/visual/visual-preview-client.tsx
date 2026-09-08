"use client";

import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LaptopMinimal,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { ProximityPill } from "@/components/app/deadline-proximity";
import { CreateJobModal } from "@/components/careops/create-job-modal";
import { InsightBar } from "@/components/careops/insight-bar";
import { MetricTile } from "@/components/careops/metric-tile";
import { SegmentedMeter, LOAD_TEXT_CLASS, loadToneFromPercent } from "@/components/careops/segmented-meter";
import { StageDonut } from "@/components/careops/stage-donut";
import { Badge, type JobTypeBadgeValue } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PreviewTab = "dashboard" | "board";
type JobsListTab = "active" | "done";

function ymdOffset(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDatePt(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y.slice(2)}`;
}

const STAGE_SLICES = [
  { id: "1", name: "Backup", count: 3, color: "#EBC8B4" },
  { id: "2", name: "Em Edição", count: 7, color: "#A7C1E3" },
  { id: "3", name: "Em Aprovação", count: 4, color: "#EADFB4" },
  { id: "4", name: "Entregue", count: 0, color: "#B8DCC8" },
];

const BOARD_COLUMNS = [
  {
    name: "Backup",
    color: "#EBC8B4",
    cards: [
      { title: "Casamento Ana & Pedro", meta: "Foto · Final 12/09", people: "AM" },
      { title: "Ensaio Marina", meta: "Foto e Vídeo · 14/09", people: "GL" },
    ],
  },
  {
    name: "Em Edição",
    color: "#A7C1E3",
    cards: [
      { title: "Aniversário Sofia", meta: "Foto · Final 10/09", people: "LR" },
      { title: "Pré-wedding Lucas", meta: "Vídeo · 18/09", people: "AM" },
      { title: "Corporativo Nexo", meta: "Foto · 20/09", people: "GL" },
    ],
  },
  {
    name: "Em Aprovação",
    color: "#EADFB4",
    cards: [
      { title: "Batizado Helena", meta: "Foto · Alt. 1", people: "LR" },
      { title: "Formatura UFMG", meta: "Foto e Vídeo", people: "AM" },
    ],
  },
  {
    name: "Entregue",
    color: "#B8DCC8",
    cards: [{ title: "Ensaio gestante Paula", meta: "Entregue 02/09", people: "GL" }],
  },
];

type MockJob = {
  id: string;
  name: string;
  createdBy: string;
  workType: string;
  delivery: JobTypeBadgeValue;
  deadline: string;
  internalDeadline: string;
  stage: string;
  contact: string;
  editors: { id: string; initials: string; name: string }[];
  hasDeliveryLink?: boolean;
  done?: boolean;
};

function buildMockJobs(): MockJob[] {
  return [
    {
      id: "1",
      name: "Casamento Ana & Pedro",
      createdBy: "Glauber Molinari",
      workType: "Casamento",
      delivery: "foto",
      deadline: ymdOffset(4),
      internalDeadline: ymdOffset(1),
      stage: "Backup",
      contact: "Ana Souza",
      editors: [
        { id: "a", initials: "AM", name: "Ana M." },
        { id: "g", initials: "GL", name: "Glauber" },
      ],
    },
    {
      id: "2",
      name: "Aniversário Sofia",
      createdBy: "Glauber Molinari",
      workType: "Aniversário",
      delivery: "foto",
      deadline: ymdOffset(2),
      internalDeadline: ymdOffset(0),
      stage: "Em Edição",
      contact: "Carla Mendes",
      editors: [{ id: "l", initials: "LR", name: "Lara" }],
      hasDeliveryLink: true,
    },
    {
      id: "3",
      name: "Pré-wedding Lucas",
      createdBy: "Lara Ribeiro",
      workType: "Ensaio",
      delivery: "video",
      deadline: ymdOffset(10),
      internalDeadline: ymdOffset(6),
      stage: "Em Edição",
      contact: "Lucas Lima",
      editors: [
        { id: "a", initials: "AM", name: "Ana M." },
        { id: "l", initials: "LR", name: "Lara" },
      ],
    },
    {
      id: "4",
      name: "Batizado Helena",
      createdBy: "Glauber Molinari",
      workType: "Batizado",
      delivery: "foto",
      deadline: ymdOffset(-2),
      internalDeadline: ymdOffset(-5),
      stage: "Em Aprovação",
      contact: "Helena Dias",
      editors: [{ id: "l", initials: "LR", name: "Lara" }],
    },
    {
      id: "5",
      name: "Formatura UFMG",
      createdBy: "Ana Martins",
      workType: "Formatura",
      delivery: "foto_video",
      deadline: ymdOffset(7),
      internalDeadline: ymdOffset(3),
      stage: "Em Aprovação",
      contact: "Pedro Nunes",
      editors: [
        { id: "a", initials: "AM", name: "Ana M." },
        { id: "g", initials: "GL", name: "Glauber" },
        { id: "l", initials: "LR", name: "Lara" },
      ],
    },
    {
      id: "6",
      name: "Corporativo Nexo",
      createdBy: "Glauber Molinari",
      workType: "Corporativo",
      delivery: "foto",
      deadline: ymdOffset(12),
      internalDeadline: ymdOffset(8),
      stage: "Em Edição",
      contact: "Nexo Tech",
      editors: [{ id: "g", initials: "GL", name: "Glauber" }],
    },
    {
      id: "7",
      name: "Ensaio gestante Paula",
      createdBy: "Glauber Molinari",
      workType: "Ensaio",
      delivery: "foto",
      deadline: ymdOffset(-12),
      internalDeadline: ymdOffset(-15),
      stage: "Entregue",
      contact: "Paula Reis",
      editors: [{ id: "g", initials: "GL", name: "Glauber" }],
      hasDeliveryLink: true,
      done: true,
    },
    {
      id: "8",
      name: "Álbum Família Rocha",
      createdBy: "Lara Ribeiro",
      workType: "Álbum",
      delivery: "album",
      deadline: ymdOffset(20),
      internalDeadline: ymdOffset(14),
      stage: "Diagramação",
      contact: "Família Rocha",
      editors: [{ id: "l", initials: "LR", name: "Lara" }],
    },
  ];
}

function AvatarStackPreview({
  people,
}: {
  people: { id: string; initials: string; name: string }[];
}) {
  if (people.length === 0) {
    return <span className="text-xs text-ds-muted-2">—</span>;
  }
  const shown = people.slice(0, 3);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center justify-end">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <span
            key={p.id}
            title={p.name}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-cream text-[10px] font-bold text-ds-ink ring-2 ring-ds-surface"
          >
            {p.initials}
          </span>
        ))}
        {rest > 0 ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-surface text-[0.7rem] font-semibold text-ds-muted ring-1 ring-ds-border">
            +{rest}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function JobActionsPreview({ hasLink }: { hasLink?: boolean }) {
  return (
    <div className="flex justify-end gap-1">
      {hasLink ? (
        <button
          type="button"
          aria-label="Abrir material"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Editar job"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Excluir job"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ds-muted transition-colors hover:bg-ds-danger-soft hover:text-ds-danger"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function VisualPreviewClient() {
  const [tab, setTab] = useState<PreviewTab>("dashboard");
  const [jobsTab, setJobsTab] = useState<JobsListTab>("active");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const allJobs = useMemo(() => buildMockJobs(), []);
  const activeJobs = useMemo(
    () => STAGE_SLICES.reduce((sum, s) => sum + s.count, 0),
    []
  );

  const listedJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allJobs.filter((j) => {
      const matchTab = jobsTab === "done" ? Boolean(j.done) : !j.done;
      if (!matchTab) return false;
      if (!q) return true;
      return (
        j.name.toLowerCase().includes(q) ||
        j.contact.toLowerCase().includes(q) ||
        j.stage.toLowerCase().includes(q) ||
        j.workType.toLowerCase().includes(q)
      );
    });
  }, [allJobs, jobsTab, query]);

  return (
    <div className="flex min-h-screen bg-ds-cream">
      <aside className="sticky top-0 hidden h-screen w-[15.5rem] shrink-0 flex-col border-r border-ds-border bg-ds-surface md:flex">
        <div className="flex h-16 items-center border-b border-ds-border px-4">
          <Image
            src="/brand/logo-dony-png.png"
            alt="Donyapp"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Preview">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ds-muted-2">
            Preview visual
          </p>
          <button
            type="button"
            onClick={() => setTab("dashboard")}
            className={cn(
              "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
              tab === "dashboard"
                ? "bg-ds-ink text-ds-on-dark shadow-ds-sm"
                : "text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
            )}
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setTab("board")}
            className={cn(
              "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
              tab === "board"
                ? "bg-ds-ink text-ds-on-dark shadow-ds-sm"
                : "text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
            )}
          >
            <LaptopMinimal className="h-5 w-5" aria-hidden />
            Pós-Produção
          </button>
        </nav>
        <div className="border-t border-ds-border p-4">
          <p className="text-xs font-semibold text-ds-ink">Estúdio Demo</p>
          <p className="text-[11px] text-ds-muted">Sem login · dados fictícios</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-ds-border bg-ds-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ds-accent">
                Preview CareOps
              </p>
              <p className="text-sm text-ds-muted">
                Área pública — não usa conta nem redireciona para produção.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-ds-border bg-ds-cream/60 p-1 md:hidden">
              <button
                type="button"
                onClick={() => setTab("dashboard")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  tab === "dashboard"
                    ? "bg-ds-ink text-ds-on-dark"
                    : "text-ds-muted"
                )}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setTab("board")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  tab === "board" ? "bg-ds-ink text-ds-on-dark" : "text-ds-muted"
                )}
              >
                Pós-Produção
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {tab === "dashboard" ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ds-muted-2">
                    Estúdio
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ds-ink">
                    Dashboard
                  </h1>
                  <p className="mt-1.5 max-w-xl text-sm text-ds-muted">
                    Visão rápida da fila, dos prazos e do ritmo de entrega.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ds-accent px-4 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Novo job
                </button>
              </div>

              <InsightBar onCtaClick={() => setTab("board")} cta="Abrir Pós-Produção">
                <span className="font-semibold text-ds-ink">Neste mês:</span> 9
                entrega(s) e 11 item(ns) com prazo. Vale conferir o quadro para não
                perder o ritmo.
              </InsightBar>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                  label="Atrasados"
                  value={2}
                  icon={AlertCircle}
                  tone="danger"
                  trend={{
                    direction: "up",
                    label: "precisa ação",
                    sentiment: "bad",
                  }}
                  hint="Prazo final vencido"
                />
                <MetricTile
                  label="Prazo ≤ 3 dias"
                  value={4}
                  icon={CalendarClock}
                  tone="warn"
                  trend={{
                    direction: "up",
                    label: "esta semana",
                    sentiment: "warn",
                  }}
                  hint="Atenção esta semana"
                />
                <MetricTile
                  label="Entregues no mês"
                  value={9}
                  icon={PackageCheck}
                  tone="success"
                  trend={{
                    direction: "up",
                    label: "no mês",
                    sentiment: "good",
                  }}
                />
                <MetricTile
                  label="A editar no mês"
                  value={11}
                  icon={CalendarDays}
                  tone="info"
                  trend={{
                    direction: "up",
                    label: "com prazo",
                    sentiment: "neutral",
                  }}
                />
              </section>

              <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                <div className="flex items-center justify-center rounded-[1.125rem] border border-ds-border/70 bg-ds-surface p-4 shadow-ds-md">
                  <StageDonut slices={STAGE_SLICES} />
                </div>
                <div className="rounded-[1.125rem] border border-ds-border/70 bg-ds-surface p-4 shadow-ds-md sm:p-5">
                  <div className="mb-4">
                    <h2 className="font-display text-base font-bold text-ds-ink">
                      Performance por etapa
                    </h2>
                    <p className="text-xs text-ds-muted">
                      Onde a fila está concentrada agora
                    </p>
                  </div>
                  <ul className="flex flex-col gap-3.5">
                    {STAGE_SLICES.filter((s) => s.count > 0).map((s) => {
                      const util = Math.round((s.count / activeJobs) * 100);
                      const loadTone = loadToneFromPercent(util);
                      return (
                      <li key={s.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-ds-ink"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${s.color} 22%, white)`,
                              }}
                            >
                              {s.name.slice(0, 1)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-ds-ink">
                                {s.name}
                              </p>
                              <p className="text-[11px] text-ds-muted">
                                {s.count} jobs
                              </p>
                            </div>
                          </div>
                          <p
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              LOAD_TEXT_CLASS[loadTone]
                            )}
                          >
                            {util}%
                          </p>
                        </div>
                        <SegmentedMeter
                          value={s.count}
                          max={activeJobs}
                          tone="load"
                          segments={20}
                        />
                      </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <section className="rounded-[1.25rem] border border-ds-border/70 bg-ds-surface p-4 shadow-ds-md sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ds-ink">
                      Lista de jobs
                    </h2>
                    <p className="text-xs text-ds-muted-2">
                      {jobsTab === "done"
                        ? "Entregues ou concluídos ficam aqui para não poluir a fila."
                        : "Ativos, ordenados pelo prazo final mais próximo."}
                    </p>
                  </div>
                  <div className="relative w-full sm:max-w-sm">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por job, contato, etapa ou tipo…"
                      className="w-full rounded-full border border-ds-border bg-ds-cream/40 py-2.5 pl-10 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2 focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20"
                    />
                  </div>
                </div>

                <div className="mb-4 inline-flex w-full rounded-full border border-ds-border bg-ds-cream/50 p-1 sm:w-auto">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
                      jobsTab === "active"
                        ? "bg-ds-ink text-ds-on-dark shadow-sm"
                        : "text-ds-muted hover:text-ds-ink"
                    )}
                    onClick={() => setJobsTab("active")}
                    aria-pressed={jobsTab === "active"}
                  >
                    Ativos
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
                      jobsTab === "done"
                        ? "bg-ds-ink text-ds-on-dark shadow-sm"
                        : "text-ds-muted hover:text-ds-ink"
                    )}
                    onClick={() => setJobsTab("done")}
                    aria-pressed={jobsTab === "done"}
                  >
                    Concluídos
                  </button>
                </div>

                {listedJobs.length === 0 ? (
                  <p className="text-sm text-ds-muted">
                    {query.trim()
                      ? `Nenhum job encontrado para “${query.trim()}”.`
                      : jobsTab === "done"
                        ? "Nenhuma edição concluída ainda."
                        : "Nenhum job ativo na fila."}
                  </p>
                ) : (
                  <>
                    <div className="hidden overflow-hidden rounded-[1rem] border border-ds-border lg:block">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-ds-border bg-ds-cream/90">
                            <th className="px-4 py-3 font-medium text-ds-muted">Job</th>
                            <th className="px-4 py-3 font-medium text-ds-muted">
                              Trabalho / entrega
                            </th>
                            <th className="px-4 py-3 font-medium text-ds-muted">
                              Prazos
                            </th>
                            <th className="px-4 py-3 font-medium text-ds-muted">
                              Perto do prazo
                            </th>
                            <th className="px-4 py-3 font-medium text-ds-muted">
                              Etapa
                            </th>
                            <th className="px-4 py-3 font-medium text-ds-muted">
                              Contato
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-ds-muted">
                              Editando
                            </th>
                            <th className="w-28 px-4 py-3 text-right font-medium text-ds-muted">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {listedJobs.map((j) => (
                            <tr
                              key={j.id}
                              className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                            >
                              <td className="px-4 py-3">
                                <div className="flex min-w-0 flex-col gap-1">
                                  <span className="truncate font-medium text-ds-ink">
                                    {j.name}
                                  </span>
                                  <span className="text-xs text-ds-muted-2">
                                    Criado por {j.createdBy}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-ds-muted">
                                    {j.workType}
                                  </span>
                                  <Badge kind="job-type" value={j.delivery} />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-ds-muted">
                                    Final {formatDatePt(j.deadline)}
                                  </span>
                                  <span className="text-xs text-ds-muted-2">
                                    Interno {formatDatePt(j.internalDeadline)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <ProximityPill deadline={j.deadline} />
                              </td>
                              <td className="px-4 py-3 text-ds-muted">{j.stage}</td>
                              <td className="px-4 py-3 text-ds-muted">
                                {j.contact}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <AvatarStackPreview people={j.editors} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <JobActionsPreview hasLink={j.hasDeliveryLink} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="flex flex-col gap-3 lg:hidden">
                      {listedJobs.map((j) => (
                        <li
                          key={j.id}
                          className="rounded-[1rem] border border-ds-border/70 bg-ds-cream/30 p-3.5 shadow-ds-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ds-ink">
                                {j.name}
                              </p>
                              <p className="mt-0.5 text-xs text-ds-muted-2">
                                Criado por {j.createdBy}
                              </p>
                            </div>
                            <JobActionsPreview hasLink={j.hasDeliveryLink} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge kind="job-type" value={j.delivery} />
                            <span className="rounded-full border border-ds-border bg-ds-surface px-2 py-0.5 text-[11px] text-ds-muted">
                              {j.workType}
                            </span>
                            <span className="rounded-full border border-ds-border bg-ds-surface px-2 py-0.5 text-[11px] text-ds-muted">
                              {j.stage}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ds-muted">
                            <span>{j.contact}</span>
                            <span>
                              Final {formatDatePt(j.deadline)} · Int.{" "}
                              {formatDatePt(j.internalDeadline)}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <ProximityPill deadline={j.deadline} />
                            <AvatarStackPreview people={j.editors} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ds-muted-2">
                    Pós-produção
                  </p>
                  <h1 className="font-display text-3xl font-bold tracking-tight text-ds-ink">
                    Edições
                  </h1>
                  <div className="mt-2 inline-flex rounded-full border border-ds-border bg-ds-cream/50 p-1">
                    <span className="rounded-full bg-ds-ink px-3.5 py-1.5 text-xs font-semibold text-ds-on-dark">
                      Edições
                    </span>
                    <span className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-ds-muted">
                      Álbuns
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ds-accent px-4 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Novo job
                </button>
              </div>

              <div className="w-full min-w-0 overflow-x-auto pb-4 [scrollbar-width:thin]">
                <div className="flex w-max min-w-full gap-3">
                  {(() => {
                    const boardTotal = BOARD_COLUMNS.reduce(
                      (sum, c) => sum + c.cards.length,
                      0
                    );
                    const loadMax = Math.max(boardTotal, 1);
                    return BOARD_COLUMNS.map((col) => {
                    const loadPct = Math.round((col.cards.length / loadMax) * 100);
                    const loadTone = loadToneFromPercent(loadPct);
                    return (
                    <div
                      key={col.name}
                      className="flex w-[min(88vw,18rem)] shrink-0 flex-col overflow-hidden rounded-[1.25rem] border border-ds-border/50 shadow-ds-md lg:w-64"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${col.color} 13%, rgb(250 249 247))`,
                      }}
                    >
                      <div
                        className="border-b border-ds-border/30 px-3 py-3"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${col.color} 18%, white)`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ds-ink-2">
                            {col.name}
                          </h2>
                          <span
                            className={cn(
                              "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-1.5 text-[11px] font-semibold tabular-nums shadow-sm",
                              LOAD_TEXT_CLASS[loadTone]
                            )}
                            title={`${loadPct}% da fila`}
                          >
                            {col.cards.length}
                          </span>
                        </div>
                        <SegmentedMeter
                          className="mt-2.5"
                          value={col.cards.length}
                          max={loadMax}
                          segments={12}
                          tone="load"
                        />
                      </div>
                      <div className="flex flex-col gap-2.5 p-2.5">
                        {col.cards.map((card) => (
                          <div
                            key={card.title}
                            className="rounded-[1rem] border border-ds-border/60 bg-white p-3 shadow-ds-md"
                            style={{
                              boxShadow: `inset 3px 0 0 0 ${col.color}, 0 1px 2px rgb(12 10 9 / 0.05)`,
                            }}
                          >
                            <p className="text-sm font-semibold text-ds-ink">
                              {card.title}
                            </p>
                            <p className="mt-1 text-[11px] text-ds-muted">
                              {card.meta}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] font-medium uppercase tracking-wide text-ds-muted-2">
                                Equipe
                              </span>
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ds-cream text-[10px] font-bold text-ds-ink ring-2 ring-white">
                                {card.people}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateJobModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
