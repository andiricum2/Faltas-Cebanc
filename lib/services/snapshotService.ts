import type { StudentSnapshot as Snapshot, WeekSessions, AggregatedStats, RetoInfo } from "@/lib/types/faltas";
import { extractAbsenceCode, sumarFaltas, isRetoModule } from "@/lib/utils";

export type ModuleRow = { key: string; classes: number; absences: string };

export type Kpis = {
  totalAbsences: number;
  last30: number;
  prev30: number;
  delta: number;
  topModules: Array<{ key: string; count: number }>;
};

export function buildModulesTable(snapshot: Snapshot): {
  normalModules: ModuleRow[];
  retoModules: ModuleRow[];
} {
  const allModules = Object.keys(snapshot.aggregated.modules).map(key => {
    const module = snapshot.aggregated.modules[key];
    const classes = module?.classesGiven || 0;
    const absences = sumarFaltas(module?.absenceCounts);
    return { key, classes, absences: absences.toString() };
  });

  const normalModules = allModules.filter(row => 
    !isRetoModule(row.key, snapshot.legend.modules[row.key])
  );
  
  // Para los módulos de reto, usar los datos específicos de snapshot.retos
  const retoModules = snapshot.retos?.map((reto: RetoInfo) => ({
    key: reto.id,
    classes: snapshot.aggregated.modules[reto.id]?.classesGiven || 0,
    absences: sumarFaltas(snapshot.aggregated.modules[reto.id]?.absenceCounts).toString()
  })) || [];

  return { normalModules, retoModules };
}

export function buildTopLine(snapshot: Snapshot): string {
  const nWeeks = snapshot.weeks.length;
  const start = snapshot.weeks[0]?.weekStartISO || "";
  const end = snapshot.weeks[nWeeks - 1]?.weekEndISO || "";
  return `${nWeeks} semanas · ${start} → ${end}`;
}

export function buildWeeklySeries(
  snapshot: Snapshot,
  moduleFilter: string,
  absenceFilter: string
): Array<{ label: string; total: number } & Record<string, number>> {
  return snapshot.weeks.map((w, idx) => {
    const counters = w.sessions.reduce((acc, s) => {
      const code = extractAbsenceCode(s.cssClass);
      const mod = s.title;
      if (!code) return acc;
      if (moduleFilter !== "all" && mod !== moduleFilter) return acc;
      if (absenceFilter !== "all" && code !== absenceFilter) return acc;
      acc.total += 1;
      (acc as any)[code] = ((acc as any)[code] || 0) + 1;
      return acc;
    }, { label: `${w.weekStartISO}`, total: 0 } as any);
    (counters as any).__index = idx;
    return counters as any;
  });
}

export function buildMonthlySeries(
  snapshot: Snapshot,
  moduleFilter: string,
  absenceFilter: string
): Array<{ month: string; total: number }> {
  const byMonth: Record<string, number> = {};
  snapshot.weeks.forEach((w) => {
    w.sessions.forEach((s) => {
      const code = extractAbsenceCode(s.cssClass);
      const mod = s.title;
      if (!code) return;
      if (moduleFilter !== "all" && mod !== moduleFilter) return;
      if (absenceFilter !== "all" && code !== absenceFilter) return;
      const month = s.dateISO.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

export function buildKpis(snapshot: Snapshot): Kpis {
  const now = new Date();
  const iso30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  let total = 0, last30 = 0, prev30 = 0;
  const moduleCounts: Record<string, number> = {};
  
  snapshot.weeks.forEach((w) => {
    w.sessions.forEach((s) => {
      const code = extractAbsenceCode(s.cssClass);
      if (!code) return;
      const d = new Date(s.dateISO + "T00:00:00Z");
      total += 1;
      if (d >= iso30) last30 += 1; else prev30 += 1;
      const mod = s.title || "?";
      moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
    });
  });
  
  const topModules = Object.entries(moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({ key, count }));
  
  const delta = last30 - Math.min(prev30, last30);
  return { totalAbsences: total, last30, prev30, delta, topModules };
}

export function buildSelectedWeek(
  snapshot: Snapshot,
  selectedWeekIdx: number | null,
  moduleFilter: string,
  absenceFilter: string
): (WeekSessions & { sessions: WeekSessions["sessions"] }) | null {
  const idx = selectedWeekIdx ?? (snapshot.weeks.length ? snapshot.weeks.length - 1 : null);
  if (idx === null || idx < 0 || idx >= snapshot.weeks.length) return null;
  const w = snapshot.weeks[idx];
  const sessions = w.sessions.filter((s) => {
    const code = extractAbsenceCode(s.cssClass);
    const mod = s.title;
    if (moduleFilter !== "all" && mod !== moduleFilter) return false;
    if (absenceFilter !== "all" && code !== absenceFilter) return false;
    return true;
  });
  return { ...w, sessions };
}


