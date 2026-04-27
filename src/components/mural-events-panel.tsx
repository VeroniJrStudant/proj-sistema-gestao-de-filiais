"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMuralEvent, deleteMuralEvent, listMuralEventsByPeriod } from "@/app/(main)/mural/actions";
import type { MuralEventRow } from "@/lib/mural-data";

type ViewMode = "week" | "month";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + mondayOffset);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHm(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatShortDatePt(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function eventEndsIso(e: MuralEventRow): string {
  return e.endsAtIso ?? e.startsAtIso;
}

function overlapsDay(e: MuralEventRow, day: Date): boolean {
  const start = new Date(e.startsAtIso);
  const end = new Date(eventEndsIso(e));
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = addDays(dayStart, 1);
  return start < dayEnd && end >= dayStart;
}

function groupEventsByDay(events: MuralEventRow[], weekStart: Date): Record<string, MuralEventRow[]> {
  const out: Record<string, MuralEventRow[]> = {};
  for (let i = 0; i < 7; i++) {
    out[ymd(addDays(weekStart, i))] = [];
  }
  for (const e of events) {
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      if (overlapsDay(e, day)) {
        out[ymd(day)]?.push(e);
      }
    }
  }
  for (const k of Object.keys(out)) {
    out[k]!.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso) || a.title.localeCompare(b.title));
  }
  return out;
}

function MonthGrid({
  monthCursor,
  events,
}: {
  monthCursor: Date;
  events: MuralEventRow[];
}) {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
  const monthYearKey = useMemo(
    () => `${monthCursor.getFullYear()}-${pad2(monthCursor.getMonth() + 1)}`,
    [monthCursor],
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, MuralEventRow[]> = {};
    for (const day of days) map[ymd(day)] = [];
    for (const e of events) {
      const s = new Date(e.startsAtIso);
      const key = ymd(s);
      if (map[key]) map[key]!.push(e);
    }
    for (const k of Object.keys(map)) {
      map[k]!.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso) || a.title.localeCompare(b.title));
    }
    return map;
  }, [events, monthYearKey]);

  const dow = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

  return (
    <div className="rounded-xl border border-line-soft bg-shell/40">
      <div className="grid grid-cols-7 border-b border-line-soft">
        {dow.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthCursor.getMonth();
          const key = ymd(day);
          const items = eventsByDay[key] ?? [];
          return (
            <div
              key={key}
              className={`min-h-[92px] border-r border-b border-line-soft px-2 py-2 ${inMonth ? "" : "bg-panel/30"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${inMonth ? "text-ink" : "text-muted"}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {items.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded bg-accent/10 px-2 py-1 text-[11px] font-medium text-ink ring-1 ring-accent/20"
                    title={e.title}
                  >
                    {e.allDay ? "Dia todo · " : `${formatHm(new Date(e.startsAtIso))} · `}
                    {e.title}
                  </div>
                ))}
                {items.length > 2 ? (
                  <div className="text-[11px] font-medium text-muted">+{items.length - 2} mais</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 text-[11px] text-subtle">
        Mostrando {formatShortDatePt(first)} – {formatShortDatePt(last)}
      </div>
    </div>
  );
}

function WeekGrid({ weekStart, events }: { weekStart: Date; events: MuralEventRow[] }) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekStartKey = useMemo(() => weekStart.toISOString(), [weekStart]);
  const byDay = useMemo(() => groupEventsByDay(events, weekStart), [events, weekStartKey]);
  const today = new Date();

  return (
    <div className="rounded-xl border border-line-soft bg-shell/40">
      <div className="grid grid-cols-7 border-b border-line-soft">
        {days.map((d) => (
          <div key={ymd(d)} className="px-2 py-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][d.getDay() === 0 ? 6 : d.getDay() - 1]}
            </div>
            <div
              className={`mt-0.5 text-xs font-semibold ${
                sameDay(d, today) ? "text-accent" : "text-ink"
              }`}
            >
              {formatShortDatePt(d)}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const items = byDay[ymd(d)] ?? [];
          return (
            <div key={ymd(d)} className="min-h-[140px] border-r border-line-soft px-2 py-2">
              {items.length === 0 ? (
                <div className="text-[11px] text-subtle">—</div>
              ) : (
                <div className="space-y-1">
                  {items.slice(0, 6).map((e) => (
                    <div
                      key={e.id}
                      className="rounded bg-accent/10 px-2 py-1 text-[11px] font-medium text-ink ring-1 ring-accent/20"
                      title={e.description ?? e.title}
                    >
                      <div className="truncate">
                        {e.allDay ? "Dia todo" : formatHm(new Date(e.startsAtIso))} · {e.title}
                      </div>
                    </div>
                  ))}
                  {items.length > 6 ? (
                    <div className="text-[11px] font-medium text-muted">+{items.length - 6} mais</div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MuralEventsPanel({
  role,
  weekStartIso,
  weekEndIso,
  eventsThisWeek,
  eventsThisMonth,
}: {
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "LEGAL_GUARDIAN";
  weekStartIso: string;
  weekEndIso: string;
  eventsThisWeek: MuralEventRow[];
  eventsThisMonth: MuralEventRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<ViewMode>("week");
  const [monthCursor, setMonthCursor] = useState(() => new Date(weekStartIso));
  const [periodFromYmd, setPeriodFromYmd] = useState(() => ymd(new Date(weekStartIso)));
  const [periodToYmd, setPeriodToYmd] = useState(() => ymd(new Date(weekEndIso)));
  const [periodEvents, setPeriodEvents] = useState<MuralEventRow[]>(eventsThisWeek);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateYmd, setDateYmd] = useState(() => ymd(new Date()));
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => {
    const d = new Date(periodFromYmd);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [periodFromYmd]);
  const weekEnd = useMemo(() => {
    const d = new Date(periodToYmd);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [periodToYmd]);

  const tabClass = (active: boolean) =>
    [
      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
      active ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:bg-line-soft hover:text-ink",
    ].join(" ");

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  const labelClass = "block text-xs font-medium text-muted";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Eventos</p>
          <p className="mt-0.5 text-sm text-muted">
            Período: {formatShortDatePt(weekStart)} – {formatShortDatePt(weekEnd)}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-1 rounded-lg border border-line-soft bg-elevated-2 p-1"
          role="tablist"
          aria-label="Visualização do calendário"
        >
          <button type="button" role="tab" aria-selected={view === "week"} className={tabClass(view === "week")} onClick={() => setView("week")} disabled={pending}>
            Semana
          </button>
          <button type="button" role="tab" aria-selected={view === "month"} className={tabClass(view === "month")} onClick={() => setView("month")} disabled={pending}>
            Mês
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line-soft bg-shell/50 px-3 py-3">
        <label className="min-w-[160px] flex-1">
          <span className={labelClass}>De</span>
          <input
            className={inputClass}
            type="date"
            value={periodFromYmd}
            onChange={(e) => setPeriodFromYmd(e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="min-w-[160px] flex-1">
          <span className={labelClass}>Até</span>
          <input
            className={inputClass}
            type="date"
            value={periodToYmd}
            onChange={(e) => setPeriodToYmd(e.target.value)}
            disabled={pending}
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-elevated-2 disabled:opacity-50"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await listMuralEventsByPeriod({ fromYmd: periodFromYmd, toYmd: periodToYmd });
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setPeriodEvents(r.events);
              setView("week");
            });
          }}
        >
          Aplicar
        </button>
        <button
          type="button"
          className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-elevated-2 disabled:opacity-50"
          disabled={pending}
          onClick={() => {
            setError(null);
            setPeriodFromYmd(ymd(new Date(weekStartIso)));
            setPeriodToYmd(ymd(new Date(weekEndIso)));
            setPeriodEvents(eventsThisWeek);
            setView("week");
          }}
        >
          Semana atual
        </button>
      </div>

      {view === "month" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-ink">
            {monthCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-elevated-2 disabled:opacity-50"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              disabled={pending}
            >
              ←
            </button>
            <button
              type="button"
              className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-elevated-2 disabled:opacity-50"
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              disabled={pending}
            >
              →
            </button>
          </div>
        </div>
      ) : null}

      {view === "week" ? <WeekGrid weekStart={weekStart} events={periodEvents} /> : <MonthGrid monthCursor={monthCursor} events={eventsThisMonth} />}

      <div className="rounded-xl bg-panel/60 px-4 py-4 text-sm text-muted ring-1 ring-line-soft">
        {periodEvents.length === 0 ? (
          <p>Sem eventos nesta semana.</p>
        ) : (
          <ul className="space-y-2">
            {periodEvents.slice(0, 8).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{e.title}</p>
                  <p className="text-xs text-subtle">
                    {formatShortDatePt(new Date(e.startsAtIso))}
                    {" · "}
                    {e.allDay ? "Dia todo" : formatHm(new Date(e.startsAtIso))}
                    {e.endsAtIso ? ` – ${formatHm(new Date(e.endsAtIso))}` : ""}
                  </p>
                </div>
                {role === "ADMIN" ? (
                  <button
                    type="button"
                    className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-elevated-2 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm("Excluir este evento?")) return;
                      setError(null);
                      startTransition(async () => {
                        const r = await deleteMuralEvent({ id: e.id });
                        if (!r.ok) {
                          setError(r.error);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                  >
                    Excluir
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {role === "ADMIN" ? (
        <form
          className="rounded-2xl border border-line-soft bg-elevated-2 p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const r = await createMuralEvent({
                title,
                description,
                dateYmd,
                allDay,
                startTimeHm: allDay ? null : startTime,
                endTimeHm: allDay ? null : endTime || null,
              });
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setTitle("");
              setDescription("");
              setEndTime("");
              router.refresh();
            });
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">Agendar evento</h3>
            <span className="text-xs text-muted">Aparece no Mural e no calendário</span>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Título</span>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex.: Reunião de pais, passeio, avaliação…" disabled={pending} />
            </label>

            <label className="block">
              <span className={labelClass}>Data</span>
              <input className={inputClass} type="date" value={dateYmd} onChange={(e) => setDateYmd(e.target.value)} disabled={pending} />
            </label>

            <label className="flex items-end gap-2">
              <input type="checkbox" className="rounded border-line text-accent focus:ring-accent" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={pending} />
              <span className="text-sm text-ink">Dia todo</span>
            </label>

            {!allDay ? (
              <>
                <label className="block">
                  <span className={labelClass}>Início</span>
                  <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={pending} />
                </label>
                <label className="block">
                  <span className={labelClass}>Fim (opcional)</span>
                  <input className={inputClass} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={pending} />
                </label>
              </>
            ) : null}

            <label className="block sm:col-span-2">
              <span className={labelClass}>Descrição (opcional)</span>
              <textarea className={`${inputClass} min-h-[90px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} disabled={pending} />
            </label>
          </div>

          <div className="mt-4 flex justify-end border-t border-line-soft pt-4">
            <button
              type="submit"
              disabled={pending || title.trim().length < 2}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Salvar evento"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

