import type { WeekSessions } from "@/lib/types/faltas";

const faltaRe = /\bfalta[_\s-]([a-z])\b/;

export function aggregateWeeklyAbsences(selectedWeek: (WeekSessions & { sessions: WeekSessions["sessions"] }) | null): Array<{ date: string; total: number; types: Record<string, number> }> {
  if (!selectedWeek) return [];
  const byDate: Record<string, { total: number; types: Record<string, number> }> =
    Object.fromEntries(selectedWeek.daysISO.map(d => [d, { total: 0, types: {} }]));
  for (const cell of selectedWeek.sessions) {
    const date = (cell as any).dateISO;
    if (!date || !(date in byDate)) continue;
    const match = ((cell as any).cssClass || "").toLowerCase().match(faltaRe);
    if (!match) continue;
    const type = match[1].toUpperCase();
    const bucket = byDate[date];
    bucket.total += 1;
    bucket.types[type] = (bucket.types[type] || 0) + 1;
  }
  return Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
}

