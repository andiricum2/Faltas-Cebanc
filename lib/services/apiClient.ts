/**
 * Servicio cliente para consumir endpoints de estadísticas y cálculos
 */

import type { WeekSessions } from "@/lib/types/faltas";

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

export type CalculateResponse = {
  general: {
    totalSessions: number;
    totalAbsences: number;
    currentPercent: number;
    projectedPercent: number;
  };
  module: {
    totalSessions: number;
    totalAbsences: number;
    currentPercent: number;
    projectedPercent: number;
  };
  retoAnalysis?: {
    reto: {
      current: number;
      projected: number;
      classes: number;
    };
    modules: Array<{
      code: string;
      label: string;
      current: number;
      projected: number;
      classes: number;
    }>;
  };
  moduleMeta: Array<{
    code: string;
    label: string;
    classes: number;
    absDirectas: number;
    isReto: boolean;
    group: string | null;
  }>;
};

export type SelectedWeekResponse = {
  week: (WeekSessions & { sessions: WeekSessions["sessions"] }) | null;
  absenceLegend: Record<string, string>;
  moduleLegend: Record<string, string>;
};

export async function getStatistics(
  dni: string, 
  moduleFilter: string = "all", 
  absenceFilter: string = "all"
): Promise<StatisticsResponse> {
  const params = new URLSearchParams({
    dni,
    moduleFilter,
    absenceFilter
  });
  
  const response = await fetch(`/api/faltas/statistics?${params}`);
  if (!response.ok) {
    throw new Error(`Error fetching statistics: ${response.statusText}`);
  }
  return response.json();
}

export async function getSelectedWeek(
  dni: string,
  selectedWeekIdx: number | null,
  moduleFilter: string = "all",
  absenceFilter: string = "all"
): Promise<SelectedWeekResponse> {
  const params = new URLSearchParams({
    dni,
    selectedWeekIdx: selectedWeekIdx?.toString() || "",
    moduleFilter,
    absenceFilter
  });
  
  const response = await fetch(`/api/faltas/selectedWeek?${params}`);
  if (!response.ok) {
    throw new Error(`Error fetching selected week: ${response.statusText}`);
  }
  return response.json();
}

export async function getCalculations(
  dni: string, 
  selectedModule: string = "__general__", 
  addedAbsences: number = 0
): Promise<CalculateResponse> {
  const params = new URLSearchParams({
    dni,
    module: selectedModule,
    addedAbsences: addedAbsences.toString()
  });
  
  const response = await fetch(`/api/faltas/calculate?${params}`);
  if (!response.ok) {
    throw new Error(`Error fetching calculations: ${response.statusText}`);
  }
  return response.json();
}
