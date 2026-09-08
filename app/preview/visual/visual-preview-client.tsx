"use client";

import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LaptopMinimal,
  PackageCheck,
  Plus,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { InsightBar } from "@/components/careops/insight-bar";
import { MetricTile } from "@/components/careops/metric-tile";
import { SegmentedMeter } from "@/components/careops/segmented-meter";
import { StageDonut } from "@/components/careops/stage-donut";
import { cn } from "@/lib/utils";

type PreviewTab = "dashboard" | "board";

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

const MOCK_JOBS = [
  {
    name: "Casamento Ana & Pedro",
    type: "Foto",
    stage: "Backup",
    contact: "Ana Souza",
    deadline: "12/09",
  },
  {
    name: "Aniversário Sofia",
    type: "Foto",
    stage: "Em Edição",
    contact: "Carla Mendes",
    deadline: "10/09",
  },
  {
    name: "Pré-wedding Lucas",
    type: "Vídeo",
    stage: "Em Edição",
    contact: "Lucas Lima",
    deadline: "18/09",
  },
  {
    name: "Batizado Helena",
    type: "Foto",
    stage: "Em Aprovação",
    contact: "Helena Dias",
    deadline: "08/09",
  },
];

export function VisualPreviewClient() {
  const [tab, setTab] = useState<PreviewTab>("dashboard");
  const activeJobs = useMemo(
    () => STAGE_SLICES.reduce((sum, s) => sum + s.count, 0),
    []
  );

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

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MetricTile
                  label="Jobs ativos"
                  value={activeJobs}
                  icon={ClipboardList}
                  tone="accent"
                  sparkValues={[10, 12, 14, 13, 15, 14]}
                  hint="Em etapas abertas"
                />
                <MetricTile
                  label="Atrasados"
                  value={2}
                  icon={AlertCircle}
                  tone="danger"
                  sparkValues={[3, 2, 1, 2, 3, 2]}
                  hint="Prazo final vencido"
                />
                <MetricTile
                  label="Prazo ≤ 3 dias"
                  value={4}
                  icon={CalendarClock}
                  tone="warn"
                  sparkValues={[2, 3, 4, 3, 5, 4]}
                  hint="Atenção esta semana"
                />
                <MetricTile
                  label="Entregues no mês"
                  value={9}
                  icon={PackageCheck}
                  tone="success"
                  sparkValues={[4, 5, 6, 7, 8, 9]}
                />
                <MetricTile
                  label="A editar no mês"
                  value={11}
                  icon={CalendarDays}
                  tone="info"
                  sparkValues={[8, 9, 10, 11, 10, 11]}
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
                    {STAGE_SLICES.filter((s) => s.count > 0).map((s) => (
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
                          <p className="text-xs font-semibold tabular-nums text-ds-ink">
                            {Math.round((s.count / activeJobs) * 100)}%
                          </p>
                        </div>
                        <SegmentedMeter
                          value={s.count}
                          max={activeJobs}
                          tone="accent"
                          segments={20}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <section className="rounded-[1.25rem] border border-ds-border/70 bg-ds-surface p-4 shadow-ds-md sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-display text-lg font-bold text-ds-ink">
                    Lista de jobs
                  </h2>
                  <div className="relative max-w-sm flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted-2"
                      aria-hidden
                    />
                    <input
                      readOnly
                      value=""
                      placeholder="Buscar por job, contato, etapa…"
                      className="w-full rounded-full border border-ds-border bg-ds-cream/40 py-2.5 pl-10 pr-3 text-sm text-ds-ink placeholder:text-ds-muted-2"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-[1rem] border border-ds-border">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-ds-border bg-ds-cream/90">
                        <th className="px-4 py-3 font-medium text-ds-muted">Job</th>
                        <th className="hidden px-4 py-3 font-medium text-ds-muted sm:table-cell">
                          Tipo
                        </th>
                        <th className="px-4 py-3 font-medium text-ds-muted">Etapa</th>
                        <th className="hidden px-4 py-3 font-medium text-ds-muted md:table-cell">
                          Contato
                        </th>
                        <th className="px-4 py-3 font-medium text-ds-muted">Prazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_JOBS.map((j) => (
                        <tr
                          key={j.name}
                          className="border-b border-ds-border last:border-0 hover:bg-ds-cream/60"
                        >
                          <td className="px-4 py-3 font-medium text-ds-ink">
                            {j.name}
                          </td>
                          <td className="hidden px-4 py-3 text-ds-muted sm:table-cell">
                            {j.type}
                          </td>
                          <td className="px-4 py-3 text-ds-muted">{j.stage}</td>
                          <td className="hidden px-4 py-3 text-ds-muted md:table-cell">
                            {j.contact}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-ds-muted">
                            {j.deadline}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ds-accent px-4 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Novo job
                </button>
              </div>

              <div className="w-full min-w-0 overflow-x-auto pb-4 [scrollbar-width:thin]">
                <div className="flex w-max min-w-full gap-3">
                  {BOARD_COLUMNS.map((col) => (
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
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-1.5 text-[11px] font-semibold tabular-nums text-ds-ink shadow-sm">
                            {col.cards.length}
                          </span>
                        </div>
                        <SegmentedMeter
                          className="mt-2.5"
                          value={col.cards.length}
                          max={4}
                          segments={12}
                          tone="muted"
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
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
