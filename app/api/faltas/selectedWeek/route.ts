import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot, WeekSessions } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { extractAbsenceCode } from "@/lib/utils/calculations";

export type SelectedWeekResponse = {
  week: (WeekSessions & { sessions: WeekSessions["sessions"] }) | null;
  absenceLegend: Record<string, string>;
  moduleLegend: Record<string, string>;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");
    const selectedWeekIdx = searchParams.get("selectedWeekIdx");
    const moduleFilter = searchParams.get("moduleFilter") || "all";
    const absenceFilter = searchParams.get("absenceFilter") || "all";
    
    if (!dni) {
      return NextResponse.json({ error: "DNI requerido" }, { status: 400 });
    }

    // Cargar snapshot procesado directamente
    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);

    // Obtener semana seleccionada
    const weekIdx = selectedWeekIdx ? parseInt(selectedWeekIdx) : null;
    const week = buildSelectedWeek(snapshot, weekIdx, moduleFilter, absenceFilter);

    const response: SelectedWeekResponse = {
      week,
      absenceLegend: snapshot.legend.absenceTypes || {},
      moduleLegend: snapshot.legend.modules || {}
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en /api/faltas/selectedWeek:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function buildSelectedWeek(
  snapshot: StudentSnapshot,
  selectedWeekIdx: number | null,
  moduleFilter: string,
  absenceFilter: string
): (WeekSessions & { sessions: WeekSessions["sessions"] }) | null {
  if (selectedWeekIdx === null || selectedWeekIdx < 0 || selectedWeekIdx >= snapshot.weeks.length) {
    return null;
  }

  const week = snapshot.weeks[selectedWeekIdx];
  if (!week) return null;

  // Filtrar sesiones según los filtros
  const filteredSessions = week.sessions.filter(session => {
    const code = extractAbsenceCode(session.cssClass);
    const mod = session.title;
    
    // Para la página semanal, mostrar todas las sesiones (con o sin código de ausencia)
    if (moduleFilter !== "all" && mod !== moduleFilter) return false;
    if (absenceFilter !== "all" && code !== absenceFilter) return false;
    
    return true;
  });

  return {
    ...week,
    sessions: filteredSessions
  };
}
