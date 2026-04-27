import "server-only";

import { prisma } from "@/lib/prisma";

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export type MuralBirthdayRow = {
  id: string;
  name: string;
  /** ex.: "10 Abril" */
  dateLine: string;
  /** ex.: "3 anos" */
  ageLine: string;
  roleLabel: string;
  photoUrl: string | null;
  kind: "student" | "teacher";
};

export type MuralData = {
  monthTitle: string;
  nextMonthTitle: string;
  birthdaysThisMonth: MuralBirthdayRow[];
  birthdaysNextMonth: MuralBirthdayRow[];
  todayLabel: string;
  weekRangeLabel: string;
  weekStartIso: string;
  weekEndIso: string;
  monthStartIso: string;
  monthEndIso: string;
  eventsThisWeek: MuralEventRow[];
  eventsThisMonth: MuralEventRow[];
};

export type MuralEventRow = {
  id: string;
  title: string;
  description: string | null;
  startsAtIso: string;
  endsAtIso: string | null;
  allDay: boolean;
};

function ageOnCalendarYearBirthday(birth: Date, calendarYear: number): number {
  return calendarYear - birth.getFullYear();
}

function formatDateLine(day: number, monthIndex: number): string {
  const m = MONTHS_PT[monthIndex];
  return `${String(day).padStart(2, "0")} ${m}`;
}

function fmtDay(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + mondayOffset);
  return x;
}

function toRow(
  p: { id: string; name: string; birthDate: Date | null; photoUrl: string | null },
  kind: "student" | "teacher",
  targetMonth: number,
  targetYear: number,
): MuralBirthdayRow | null {
  if (!p.birthDate) return null;
  const bd = new Date(p.birthDate);
  if (bd.getMonth() !== targetMonth) return null;
  const day = bd.getDate();
  const age = ageOnCalendarYearBirthday(bd, targetYear);
  const ageLine = age === 1 ? "1 ano" : `${age} anos`;
  return {
    id: p.id,
    name: p.name,
    dateLine: formatDateLine(day, targetMonth),
    ageLine,
    roleLabel: kind === "student" ? "ALUNO(A)" : "FUNCIONÁRIO(A)",
    photoUrl: p.photoUrl,
    kind,
  };
}

function sortByBirthDay(a: MuralBirthdayRow, b: MuralBirthdayRow): number {
  const da = Number(a.dateLine.slice(0, 2));
  const db = Number(b.dateLine.slice(0, 2));
  return da - db;
}

export async function getMuralData(): Promise<MuralData> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const nextM = (m + 1) % 12;
  const nextY = m === 11 ? y + 1 : y;

  const [students, teachers] = await Promise.all([
    prisma.student.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true, photoUrl: true },
    }),
    prisma.teacher.findMany({
      where: { active: true, birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true, photoUrl: true },
    }),
  ]);

  const birthdaysThisMonth: MuralBirthdayRow[] = [];
  const birthdaysNextMonth: MuralBirthdayRow[] = [];

  for (const s of students) {
    const row = toRow(s, "student", m, y);
    if (row) birthdaysThisMonth.push(row);
    const rowN = toRow(s, "student", nextM, nextY);
    if (rowN) birthdaysNextMonth.push(rowN);
  }
  for (const t of teachers) {
    const row = toRow(t, "teacher", m, y);
    if (row) birthdaysThisMonth.push(row);
    const rowN = toRow(t, "teacher", nextM, nextY);
    if (rowN) birthdaysNextMonth.push(rowN);
  }

  birthdaysThisMonth.sort(sortByBirthDay);
  birthdaysNextMonth.sort(sortByBirthDay);

  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndExclusive = new Date(weekEnd);
  weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);

  const monthStart = new Date(y, m, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEndExclusive = new Date(y, m + 1, 1);
  monthEndExclusive.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthEndExclusive);
  monthEnd.setDate(monthEnd.getDate() - 1);

  const [eventsThisWeekRaw, eventsThisMonthRaw] = await Promise.all([
    prisma.muralEvent.findMany({
      where: {
        startsAt: { gte: weekStart, lt: weekEndExclusive },
      },
      orderBy: [{ startsAt: "asc" }, { title: "asc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
      },
    }),
    prisma.muralEvent.findMany({
      where: {
        startsAt: { gte: monthStart, lt: monthEndExclusive },
      },
      orderBy: [{ startsAt: "asc" }, { title: "asc" }],
      take: 500,
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
      },
    }),
  ]);

  const toEventRow = (e: (typeof eventsThisWeekRaw)[number]): MuralEventRow => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startsAtIso: e.startsAt.toISOString(),
    endsAtIso: e.endsAt ? e.endsAt.toISOString() : null,
    allDay: e.allDay,
  });

  return {
    monthTitle: `${MONTHS_PT[m]} ${y}`,
    nextMonthTitle: `${MONTHS_PT[nextM]} ${nextY}`,
    birthdaysThisMonth,
    birthdaysNextMonth,
    todayLabel: fmtDay(now),
    weekRangeLabel: `${fmtDay(weekStart)} – ${fmtDay(weekEnd)}`,
    weekStartIso: weekStart.toISOString(),
    weekEndIso: weekEnd.toISOString(),
    monthStartIso: monthStart.toISOString(),
    monthEndIso: monthEnd.toISOString(),
    eventsThisWeek: eventsThisWeekRaw.map(toEventRow),
    eventsThisMonth: eventsThisMonthRaw.map(toEventRow),
  };
}
