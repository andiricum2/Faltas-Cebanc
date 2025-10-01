import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { sumRecordValuesExcludingJ, isRetoModule, extractAbsenceCode } from "@/lib/utils/calculations";

export type StatisticsResponse = {
  kpis: {
    totalAbsences: number;
    last30: number;
    prev30: number;
    delta: number;
    topModules: Array<{ key: string; count: number }>;
  };
  weeklySeries: Array<{ label: string; total: number } & Record<string, number>>;
  monthlySeries: Array<{ month: string; total: number }>;
  modulesTable: {
    normalModules: Array<{ key: string; classes: number; absences: string }>;
    retoModules: Array<{ key: string; classes: number; absences: string }>;
  };
  topLine: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");
    const moduleFilter = searchParams.get("moduleFilter") || "all";
    const absenceFilter = searchParams.get("absenceFilter") || "all";
    
    if (!dni) {
      return NextResponse.json({ error: "DNI requerido" }, { status: 400 });
    }

    // Cargar snapshot procesado directamente (sin llamada HTTP interna)
    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);

    // Calcular estadísticas con filtros
    const kpis = buildKpis(snapshot);
    const weeklySeries = buildWeeklySeries(snapshot, moduleFilter, absenceFilter);
    const monthlySeries = buildMonthlySeries(snapshot, moduleFilter, absenceFilter);
    const modulesTable = buildModulesTable(snapshot);
    const topLine = buildTopLine(snapshot);

    const response: StatisticsResponse = {
      kpis,
      weeklySeries,
      monthlySeries,
      modulesTable,
      topLine
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en /api/faltas/statistics:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function buildKpis(snapshot: StudentSnapshot) {
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

function buildWeeklySeries(
  snapshot: StudentSnapshot,
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

function buildMonthlySeries(
  snapshot: StudentSnapshot,
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

function buildModulesTable(snapshot: StudentSnapshot) {
  const allModules = Object.keys(snapshot.aggregated.modules).map(key => {
    const module = snapshot.aggregated.modules[key];
    const classes = module?.classesGiven || 0;
    const absences = sumRecordValuesExcludingJ(module?.absenceCounts);
    return { key, classes, absences: absences.toString() };
  });

  const normalModules = allModules.filter(row => 
    !isRetoModule(row.key, snapshot.legend.modules[row.key])
  );
  
  const retoModules = allModules.filter(row => 
    isRetoModule(row.key, snapshot.legend.modules[row.key])
  );

  return { normalModules, retoModules };
}

function buildTopLine(snapshot: StudentSnapshot): string {
  const nWeeks = snapshot.weeks.length;
  const start = snapshot.weeks[0]?.weekStartISO || "";
  const end = snapshot.weeks[nWeeks - 1]?.weekEndISO || "";
  return `${nWeeks} semanas · ${start} → ${end}`;
}
