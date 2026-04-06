"use client";

import { addDays, addMonths, startOfMonth } from "date-fns";
import { format, getDay, parse, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type Event as RbcEvent,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import "./agenda-rbc.css";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, formatString: string) => parse(value, formatString, new Date()),
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ptBR }),
  getDay,
  locales,
});

const MESSAGES = {
  today: "Hoje",
  previous: "Anterior",
  next: "Próximo",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  showMore: (n: number) => `+${n} mais`,
};

type ApiEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  htmlLink?: string;
};

function toRbcEvent(e: ApiEvent): RbcEvent {
  if (e.allDay) {
    const start = e.start.includes("T") ? parseISO(e.start) : parseISO(`${e.start}T00:00:00`);
    const end = e.end.includes("T") ? parseISO(e.end) : parseISO(`${e.end}T00:00:00`);
    return {
      title: e.title,
      start,
      end,
      allDay: true,
      resource: e,
    };
  }
  return {
    title: e.title,
    start: parseISO(e.start),
    end: parseISO(e.end),
    allDay: false,
    resource: e,
  };
}

function normalizeRange(
  range: Date[] | { start: Date; end: Date }
): { start: Date; end: Date } {
  if (Array.isArray(range)) {
    const start = range[0];
    const last = range[range.length - 1];
    return { start, end: addDays(last, 1) };
  }
  return { start: range.start, end: range.end };
}

function initialMonthRange(): { start: Date; end: Date } {
  const start = startOfMonth(new Date());
  return { start, end: addMonths(start, 1) };
}

export function AgendaCalendar() {
  const [events, setEvents] = useState<RbcEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ start: Date; end: Date }>(initialMonthRange);

  const paddedRange = useMemo(
    () => ({
      start: addDays(range.start, -2),
      end: addDays(range.end, 2),
    }),
    [range]
  );

  const fetchEvents = useCallback(async (from: Date, until: Date) => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({
      from: from.toISOString(),
      until: until.toISOString(),
    });
    try {
      const res = await fetch(`/api/integrations/google/events?${qs.toString()}`);
      const data = (await res.json()) as { events?: ApiEvent[]; error?: string };
      if (!res.ok) {
        if (res.status === 404) {
          setEvents([]);
          setError(data.error ?? "Agenda não conectada.");
        } else {
          setError(data.error ?? "Não foi possível carregar os eventos.");
          setEvents([]);
        }
        return;
      }
      setEvents((data.events ?? []).map(toRbcEvent));
    } catch {
      setError("Falha de rede ao carregar a agenda.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(paddedRange.start, paddedRange.end);
  }, [paddedRange.start, paddedRange.end, fetchEvents]);

  const onRangeChange = useCallback((r: Date[] | { start: Date; end: Date }) => {
    setRange(normalizeRange(r));
  }, []);

  const onSelectEvent = useCallback((ev: RbcEvent) => {
    const res = ev.resource as ApiEvent | undefined;
    if (res?.htmlLink) {
      window.open(res.htmlLink, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <Card className="border-app-border bg-app-sidebar p-4 shadow-ds-card sm:p-5">
      {error ? (
        <p
          className="mb-3 rounded-ds-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="agenda-rbc relative min-h-[560px]">
        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-ds-xl bg-app-sidebar/70"
            aria-busy
            aria-label="Carregando eventos"
          >
            <Loader2 className="h-8 w-8 shrink-0 animate-spin text-app-primary" aria-hidden />
          </div>
        ) : null}
        <Calendar
          culture="pt-BR"
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 560 }}
          defaultView="month"
          views={["month", "week", "agenda"]}
          messages={MESSAGES}
          onRangeChange={onRangeChange}
          onSelectEvent={onSelectEvent}
          popup
          className={cn(loading && "opacity-60")}
        />
      </div>
    </Card>
  );
}
