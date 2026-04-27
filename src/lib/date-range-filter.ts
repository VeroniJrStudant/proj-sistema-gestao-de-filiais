/** Valores `yyyy-mm-dd` vindos de `<input type="date">`. Strings vazias = sem limite. */

export function parseLocalDateStartMs(yyyyMmDd: string): number | null {
  const t = yyyyMmDd.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  dt.setHours(0, 0, 0, 0);
  return dt.getTime();
}

/** Fim do dia local (inclusivo), para comparar timestamps do banco. */
export function parseLocalDateEndMs(yyyyMmDd: string): number | null {
  const start = parseLocalDateStartMs(yyyyMmDd);
  if (start === null) return null;
  return start + 86400000 - 1;
}

export function isMsInDateRange(ms: number, fromStr: string, toStr: string): boolean {
  const fromMs = parseLocalDateStartMs(fromStr);
  const toEndMs = toStr.trim() ? parseLocalDateEndMs(toStr) : null;
  if (fromMs !== null && ms < fromMs) return false;
  if (toEndMs !== null && ms > toEndMs) return false;
  return true;
}

/** Ano letivo da turma (`ClassRoom.year`) dentro do intervalo de calendário [de, até]. */
export function classYearInCalendarRange(
  classYear: number,
  fromStr: string,
  toStr: string,
): boolean {
  if (!fromStr.trim() && !toStr.trim()) return true;
  const fromMs = parseLocalDateStartMs(fromStr);
  const toStartMs = parseLocalDateStartMs(toStr);
  const start = fromMs ?? toStartMs;
  const end = toStartMs ?? fromMs;
  if (start === null) return true;
  const endMs = end ?? start;
  const y1 = new Date(Math.min(start, endMs)).getFullYear();
  const y2 = new Date(Math.max(start, endMs)).getFullYear();
  return classYear >= y1 && classYear <= y2;
}
