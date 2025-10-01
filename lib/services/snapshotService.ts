import type { StudentSnapshot as Snapshot, WeekSessions, AggregatedStats } from "@/lib/types/faltas";
import { extractAbsenceCode } from "@/lib/utils";

export type ModuleRow = { key: string; classes: number; absences: string };

export type Kpis = {
  totalAbsences: number;
  last30: number;
  prev30: number;
  delta: number;
  topModules: Array<{ key: string; count: number }>;
};

// Aplicar distribución de retos basada en horas configuradas
export function applyRetoDistribution(
  snapshot: Snapshot,
  retoTargets: Record<string, Record<string, boolean>>,
  hoursPerModule: Record<string, number>
): Snapshot {
  const isReto = (code: string, label: string | undefined) => 
    /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label || ""}`);
  
  const retos = Object.keys(snapshot.aggregated.modules).filter(code => 
    isReto(code, snapshot.legend.modules[code])
  );
  
  const nonRetoModules = Object.keys(snapshot.aggregated.modules).filter(code => 
    !isReto(code, snapshot.legend.modules[code])
  );
  
  // Crear una copia del snapshot para modificar
  const distributedSnapshot = {
    ...snapshot,
    aggregated: {
      ...snapshot.aggregated,
      modules: { ...snapshot.aggregated.modules },
      absenceTotals: { ...snapshot.aggregated.absenceTotals }
    },
    coeficientes: {} as Record<string, Record<string, number>>
  };
  
  for (const retoId of retos) {
    const retoFaltas = Object.entries(snapshot.aggregated.modules[retoId]?.absenceCounts || {})
      .filter(([k]) => k !== "J")
      .reduce((a, [, v]) => a + (v as number), 0);
    
    if (retoFaltas > 0) {
      // Obtener módulos asignados al reto
      let targets = nonRetoModules;
      const selected = retoTargets[retoId];
      if (selected && Object.values(selected).some(Boolean)) {
        targets = nonRetoModules.filter(m => !!selected[m]);
      }
      
      if (targets.length > 0) {
        // Calcular coeficientes basados en horas semanales
        const hours = targets.map(m => Math.max(0, Number(hoursPerModule[m] || 0)));
        const sumHours = hours.reduce((a, b) => a + b, 0);
        
        let coeficientes: Record<string, number>;
        if (sumHours > 0) {
          coeficientes = Object.fromEntries(
            targets.map((m, i) => [m, hours[i] / sumHours])
          );
        } else {
          const equal = 1 / targets.length;
          coeficientes = Object.fromEntries(
            targets.map(m => [m, equal])
          );
        }
        
        // Distribuir faltas del reto
        for (const targetCode of targets) {
          const coeficiente = coeficientes[targetCode] || 0;
          const distributedFaltas = Math.round(retoFaltas * coeficiente);
          
          if (distributedFaltas > 0) {
            // Añadir faltas al módulo destino
            if (!distributedSnapshot.aggregated.modules[targetCode]) {
              distributedSnapshot.aggregated.modules[targetCode] = { classesGiven: 0, absenceCounts: {} };
            }
            
            distributedSnapshot.aggregated.modules[targetCode].absenceCounts["F"] = 
              (distributedSnapshot.aggregated.modules[targetCode].absenceCounts["F"] || 0) + distributedFaltas;
          }
        }
        
        // Limpiar faltas del reto original (ya distribuidas)
        distributedSnapshot.aggregated.modules[retoId].absenceCounts = {};
        
        // Guardar coeficientes calculados para este reto
        distributedSnapshot.coeficientes[retoId] = coeficientes;
      }
    }
  }
  
  return distributedSnapshot;
}

export function buildModulesTable(
  snapshot: Snapshot,
  moduleFilter: string,
  absenceFilter: string
): ModuleRow[] {
  let entries = Object.entries(snapshot.aggregated.modules);
  if (moduleFilter !== "all") entries = entries.filter(([mod]) => mod === moduleFilter);
  return entries.map(([mod, v]) => ({
    key: mod,
    classes: v.classesGiven,
    absences: Object.entries(v.absenceCounts)
      .filter(([code]) => absenceFilter === "all" || code === absenceFilter)
      .map(([code, cnt]) => `${code}:${cnt}`)
      .join("  "),
  }));
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


