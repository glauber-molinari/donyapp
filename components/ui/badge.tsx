import { cn } from "@/lib/utils";

// ─── Tipos de job ────────────────────────────────────────────────────────────

export type JobTypeBadgeValue = "foto" | "video" | "foto_video" | "album";
export type DeadlineBadgeValue = "upcoming" | "overdue";

type BadgeJobTypeProps = {
  kind: "job-type";
  value: JobTypeBadgeValue;
  className?: string;
};

type BadgeDeadlineProps = {
  kind: "deadline";
  value: DeadlineBadgeValue;
  label: string;
  className?: string;
};

export type BadgeProps = BadgeJobTypeProps | BadgeDeadlineProps;

const jobTypeClass: Record<JobTypeBadgeValue, string> = {
  foto:       "bg-ds-accent-soft text-ds-accent",
  video:      "bg-ds-info-soft   text-ds-info",
  foto_video: "bg-ds-warn-soft   text-ds-warn",
  album:      "bg-ds-warn-soft   text-ds-warn",
};

const jobTypeLabel: Record<JobTypeBadgeValue, string> = {
  foto:       "Foto",
  video:      "Vídeo",
  foto_video: "Foto e Vídeo",
  album:      "Álbum",
};

const deadlineClass: Record<DeadlineBadgeValue, string> = {
  upcoming: "bg-ds-warn-soft   text-ds-warn",
  overdue:  "bg-ds-danger-soft text-ds-danger",
};

export function Badge(props: BadgeProps) {
  const base = "inline-flex w-fit max-w-max items-center self-start rounded-ds-pill px-2 py-0.5 text-xs font-medium";

  if (props.kind === "job-type") {
    return (
      <span className={cn(base, jobTypeClass[props.value], props.className)}>
        {jobTypeLabel[props.value]}
      </span>
    );
  }

  return (
    <span className={cn(base, deadlineClass[props.value], props.className)}>
      {props.label}
    </span>
  );
}

// ─── Badge semântico (6 tons) ─────────────────────────────────────────────────

export type SemanticTone = "default" | "success" | "warn" | "danger" | "info" | "ink";

type SemanticBadgeProps = {
  tone?: SemanticTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
};

const semanticClass: Record<SemanticTone, string> = {
  default: "bg-ds-hairline    text-ds-ink   border border-ds-border",
  success: "bg-ds-success-soft text-ds-success",
  warn:    "bg-ds-warn-soft   text-ds-warn",
  danger:  "bg-ds-danger-soft text-ds-danger",
  info:    "bg-ds-info-soft   text-ds-info",
  ink:     "bg-ds-ink         text-white",
};

export function SemanticBadge({ tone = "default", dot, children, className }: SemanticBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-ds-pill px-2 py-0.5 text-xs font-medium",
        semanticClass[tone],
        className
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}

// ─── Pro badge ────────────────────────────────────────────────────────────────

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-ds-pill bg-gradient-to-br from-ds-ink to-ds-ink-2 px-1.5 py-px text-[10px] font-semibold uppercase tracking-widest text-white",
        className
      )}
    >
      Pro
    </span>
  );
}
