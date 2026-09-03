import type { JobType } from "@/types/database";

const TYPE_META: { key: JobType; label: string; className: string }[] = [
  { key: "foto", label: "Foto", className: "bg-ds-accent" },
  { key: "video", label: "Vídeo", className: "bg-ds-info" },
  { key: "foto_video", label: "Foto e vídeo", className: "bg-ds-warn" },
];

export function AdminJobMix({
  byType,
  inProgress,
  finished,
  withContact,
  albumBoard,
  editBoard,
  total,
}: {
  byType: Record<JobType, number>;
  inProgress: number;
  finished: number;
  withContact: number;
  albumBoard: number;
  editBoard: number;
  total: number;
}) {
  const typeTotal = Math.max(1, TYPE_META.reduce((s, t) => s + byType[t.key], 0));
  const stageTotal = Math.max(1, inProgress + finished);
  const boardTotal = Math.max(1, albumBoard + editBoard);
  const contactPct = total > 0 ? Math.round((withContact / total) * 100) : 0;

  return (
    <section className="rounded-ds-xl border border-ds-border bg-ds-surface p-4 shadow-ds-sm sm:p-5">
      <h3 className="text-sm font-semibold text-ds-ink">Como os jobs se distribuem</h3>
      <p className="mt-1 text-sm text-ds-muted">
        Tipo de trabalho, se já saíram da coluna final e se tem contato vinculado. Nada de nome
        de job ou de cliente.
      </p>

      <MixBlock
        label="Tipo"
        segments={TYPE_META.map((t) => ({
          key: t.key,
          label: t.label,
          value: byType[t.key],
          className: t.className,
          share: byType[t.key] / typeTotal,
        }))}
      />

      <MixBlock
        label="Andamento"
        segments={[
          {
            key: "open",
            label: "Em aberto",
            value: inProgress,
            className: "bg-ds-accent",
            share: inProgress / stageTotal,
          },
          {
            key: "done",
            label: "Coluna final",
            value: finished,
            className: "bg-ds-success",
            share: finished / stageTotal,
          },
        ]}
      />

      <MixBlock
        label="Quadro"
        segments={[
          {
            key: "edit",
            label: "Edição",
            value: editBoard,
            className: "bg-ds-ink",
            share: editBoard / boardTotal,
          },
          {
            key: "album",
            label: "Álbum",
            value: albumBoard,
            className: "bg-ds-warn",
            share: albumBoard / boardTotal,
          },
        ]}
      />

      <p className="mt-4 text-sm text-ds-muted">
        {withContact} de {total} jobs têm contato vinculado ({contactPct}%).
      </p>
    </section>
  );
}

function MixBlock({
  label,
  segments,
}: {
  label: string;
  segments: { key: string; label: string; value: number; className: string; share: number }[];
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ds-muted">{label}</p>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-ds-hairline">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.key}
              className={s.className}
              style={{ inlineSize: `${Math.max(2, s.share * 100)}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ds-muted">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${s.className}`} aria-hidden />
            {s.label}{" "}
            <span className="tabular-nums text-ds-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
