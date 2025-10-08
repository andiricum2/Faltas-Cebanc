import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { logApiError, logApiSuccess } from "@/lib/logging/appLogger";
import { 
  buildKpis, 
  buildWeeklySeries, 
  buildMonthlySeries, 
  buildModulesTable, 
  buildTopLine 
} from "@/lib/services/snapshotService";

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

    // Cargar snapshot procesado
    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);

    // Calcular estadísticas
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
    logApiSuccess('/api/faltas/statistics', { dni });
  } catch (error) {
    logApiError('/api/faltas/statistics', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

