"use client";

import { AlignLeft, Calendar, ExternalLink, MapPin } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export type AgendaEventDetail = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  htmlLink?: string;
  location?: string;
  backgroundColor: string;
  textColor: string;
};

function descriptionToPlainText(html: string): string {
  if (!html.trim()) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatEventWhen(ev: AgendaEventDetail): { dateLine: string; timeLine: string | null } {
  if (ev.allDay) {
    const startDay = parseISO(`${ev.start.split("T")[0]}T12:00:00`);
    const endExclusive = parseISO(`${ev.end.split("T")[0]}T12:00:00`);
    const endLast = addDays(endExclusive, -1);
    const same = format(startDay, "yyyy-MM-dd") === format(endLast, "yyyy-MM-dd");
    const dateLine = same
      ? format(startDay, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })
      : `${format(startDay, "d MMM yyyy", { locale: ptBR })} — ${format(endLast, "d MMM yyyy", { locale: ptBR })}`;
    return { dateLine, timeLine: "Dia inteiro" };
  }
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);
  return {
    dateLine: format(s, "EEEE, d 'de' MMMM yyyy", { locale: ptBR }),
    timeLine: `${format(s, "HH:mm")} — ${format(e, "HH:mm")}`,
  };
}

export function AgendaEventModal({
  event,
  open,
  onClose,
}: {
  event: AgendaEventDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;

  const { dateLine, timeLine } = formatEventWhen(event);
  const plainDesc = event.description ? descriptionToPlainText(event.description) : "";

  return (
    <Modal open={open} onClose={onClose} title={event.title} size="xl">
      <div className="flex flex-col gap-4 text-sm text-ds-muted">
        <div className="flex gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-ds-subtle" aria-hidden />
          <div>
            <p className="font-medium text-ds-ink">{dateLine}</p>
            {timeLine ? <p className="mt-0.5">{timeLine}</p> : null}
          </div>
        </div>

        {event.location ? (
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ds-subtle" aria-hidden />
            <p className="whitespace-pre-wrap text-ds-ink">{event.location}</p>
          </div>
        ) : null}

        {plainDesc ? (
          <div className="flex gap-3">
            <AlignLeft className="mt-0.5 h-5 w-5 shrink-0 text-ds-subtle" aria-hidden />
            <p className="whitespace-pre-wrap text-ds-ink">{plainDesc}</p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 border-t border-app-border pt-4">
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-ds-border"
            style={{ backgroundColor: event.backgroundColor }}
            aria-hidden
          />
          <span className="text-ds-muted">Cor como no Google Calendar</span>
        </div>

        {event.htmlLink ? (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-ds-xl border border-app-border bg-app-sidebar text-sm font-medium text-ds-ink shadow-sm transition-colors duration-ds ease-out hover:bg-ds-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            Abrir no Google Calendar
          </a>
        ) : null}
      </div>
    </Modal>
  );
}
