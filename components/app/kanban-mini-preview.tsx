import { cn } from "@/lib/utils";

/** Ilustração leve do quadro populado (empty state / onboarding — guia: “dia 30 de uso”). */
export function KanbanMiniPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-ds-xl border border-dashed border-ds-border bg-ds-cream/60 p-4",
        className,
      )}
      aria-hidden
    >
      <p className="mb-3 text-center text-xs font-medium text-ds-muted-2">
        Exemplo: seu fluxo organizado
      </p>
      <div className="flex gap-2 overflow-hidden">
        {[
          { title: "Backup", cards: 1 },
          { title: "Edição", cards: 2, highlight: true },
          { title: "Entregue", cards: 1 },
        ].map((col) => (
          <div
            key={col.title}
            className={cn(
              "min-w-0 flex-1 rounded-lg border border-ds-border bg-ds-surface p-1.5",
              col.highlight && "ring-1 ring-ds-accent/25",
            )}
          >
            <p className="mb-1.5 truncate px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ds-muted-2">
              {col.title}
            </p>
            <div className="space-y-1">
              {Array.from({ length: col.cards }, (_, i) => (
                <div
                  key={i}
                  className="h-7 rounded-md border border-ds-border bg-ds-surface/80 text-[10px] font-medium text-ds-muted shadow-ds-sm"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
