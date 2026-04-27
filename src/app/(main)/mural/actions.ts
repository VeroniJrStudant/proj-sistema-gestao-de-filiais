"use server";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function parseLocalDateTime(dateYmd: string, timeHm: string | null): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return null;
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  let hh = 0;
  let mm = 0;
  if (timeHm) {
    if (!/^\d{2}:\d{2}$/.test(timeHm)) return null;
    const [h, min] = timeHm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    hh = h;
    mm = min;
  }
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export async function createMuralEvent(params: {
  title: string;
  description?: string | null;
  dateYmd: string;
  allDay: boolean;
  startTimeHm?: string | null;
  endTimeHm?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };
  if (session.role !== "ADMIN") return { ok: false, error: "Apenas administradores podem cadastrar eventos." };

  const title = params.title.trim();
  if (title.length < 2) return { ok: false, error: "Título inválido." };
  if (title.length > 120) return { ok: false, error: "Título muito longo (máx. 120 caracteres)." };

  const description = params.description?.trim() ? params.description.trim() : null;
  if (description && description.length > 2000) {
    return { ok: false, error: "Descrição muito longa (máx. 2000 caracteres)." };
  }

  const allDay = Boolean(params.allDay);
  const startsAt = parseLocalDateTime(params.dateYmd.trim(), allDay ? null : (params.startTimeHm ?? null));
  if (!startsAt) return { ok: false, error: "Data/hora inicial inválida." };

  let endsAt: Date | null = null;
  if (!allDay && params.endTimeHm) {
    const e = parseLocalDateTime(params.dateYmd.trim(), params.endTimeHm);
    if (!e) return { ok: false, error: "Hora final inválida." };
    endsAt = e;
  }
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return { ok: false, error: "A hora final não pode ser menor que a inicial." };
  }

  await prisma.muralEvent.create({
    data: {
      title,
      description,
      allDay,
      startsAt,
      endsAt,
      createdByUserId: session.sub,
    },
  });

  return { ok: true };
}

export async function deleteMuralEvent(params: { id: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };
  if (session.role !== "ADMIN") return { ok: false, error: "Apenas administradores podem excluir eventos." };
  const id = params.id.trim();
  if (!id) return { ok: false, error: "Evento inválido." };
  await prisma.muralEvent.delete({ where: { id } });
  return { ok: true };
}

export async function listMuralEventsByPeriod(params: {
  fromYmd: string;
  toYmd: string;
}): Promise<{ ok: true; events: Array<{ id: string; title: string; description: string | null; startsAtIso: string; endsAtIso: string | null; allDay: boolean }> } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };

  const from = parseLocalDateTime(params.fromYmd.trim(), "00:00");
  const to = parseLocalDateTime(params.toYmd.trim(), "00:00");
  if (!from || !to) return { ok: false, error: "Período inválido." };

  const fromStart = new Date(from);
  fromStart.setHours(0, 0, 0, 0);
  const toEndExclusive = new Date(to);
  toEndExclusive.setHours(0, 0, 0, 0);
  toEndExclusive.setDate(toEndExclusive.getDate() + 1);

  if (toEndExclusive.getTime() <= fromStart.getTime()) {
    return { ok: false, error: "A data final deve ser igual ou depois da inicial." };
  }
  const maxDays = 42;
  const diffDays = Math.ceil((toEndExclusive.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    return { ok: false, error: `Período muito longo (máx. ${maxDays} dias).` };
  }

  const rows = await prisma.muralEvent.findMany({
    where: { startsAt: { gte: fromStart, lt: toEndExclusive } },
    orderBy: [{ startsAt: "asc" }, { title: "asc" }],
    take: 500,
    select: { id: true, title: true, description: true, startsAt: true, endsAt: true, allDay: true },
  });

  return {
    ok: true,
    events: rows.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startsAtIso: e.startsAt.toISOString(),
      endsAtIso: e.endsAt ? e.endsAt.toISOString() : null,
      allDay: e.allDay,
    })),
  };
}

