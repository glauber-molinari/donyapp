import { AlertCircle, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

export type JobTypeBadgeValue = "foto" | "video" | "foto_video";
export type DeadlineBadgeValue = "upcoming" | "overdue";

type BadgeJobTypeProps = {
  kind: "job-type";
  value: JobTypeBadgeValue;
  className?: string;
};

type BadgeDeadlineProps = {
  kind: "deadline";
  value: DeadlineBadgeValue;
  className?: string;
};

export type BadgeProps = BadgeJobTypeProps | BadgeDeadlineProps;

const jobTypeClass: Record<JobTypeBadgeValue, string> = {
  foto: "bg-violet-100 text-violet-700",
  video: "bg-blue-100 text-blue-700",
  foto_video: "bg-amber-100 text-amber-700",
};

const jobTypeLabel: Record<JobTypeBadgeValue, string> = {
  foto: "Foto",
  video: "Vídeo",
  foto_video: "Foto + Vídeo",
};

export function Badge(props: BadgeProps) {
  if (props.kind === "job-type") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
          jobTypeClass[props.value],
          props.className
        )}
      >
        {jobTypeLabel[props.value]}
      </span>
    );
  }

  const isUpcoming = props.value === "upcoming";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        isUpcoming ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800",
        props.className
      )}
    >
      {isUpcoming ? (
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
      )}
      {isUpcoming ? "Prazo próximo" : "Atrasado"}
    </span>
  );
}
