/**
 * Servicio cliente centralizado para consumir endpoints del backend
 * y encapsular manejo de errores/autenticación.
 */

import type { WeekSessions } from "@/lib/types/faltas";

// --- Request wrapper común ---
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    const err: any = new Error("No autenticado");
    err.code = "UNAUTHENTICATED";
    throw err;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  // Intentar parsear JSON; si no hay contenido, devolver null como any
  try {
    return (await res.json()) as T;
  } catch {
    return null as unknown as T;
  }
}

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

export type CalculationPlanEntry = {
  kind: "abs" | "att";
  scope: "module" | "reto" | "general";
  code?: string;
  hours: number;
};

export type CalculatePlanResponse = {
  general: {
    base: { totalSessions: number; totalAbsences: number; percent: number };
    projected: { totalSessions: number; totalAbsences: number; percent: number };
    delta: { sessions: number; absences: number; percent: number };
  };
  byModule: Array<{
    code: string;
    label: string;
    base: { sessions: number; absences: number; percent: number };
    projected: { sessions: number; absences: number; percent: number };
    delta: { sessions: number; absences: number; percent: number };
  }>;
};

// --- Config/app ---
export type AppConfigDto = {
  config: {
    autoSyncMinutes: 0 | 5 | 15 | 30;
    selectedGroup?: string | null;
  };
};

export async function getAppConfig(): Promise<AppConfigDto> {
  return request<AppConfigDto>("/api/faltas/config/app");
}

export async function saveAppConfig(dto: AppConfigDto): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/faltas/config/app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto)
  });
}

export async function getGroups(): Promise<{ groups: string[] }> {
  return request<{ groups: string[] }>("/api/faltas/config/groups");
}

export async function getGroupByName(name: string): Promise<any> {
  return request<any>(`/api/faltas/config/groups/${encodeURIComponent(name)}`);
}

export async function saveRetoTargets(retoTargets: Record<string, Record<string, boolean>>): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/faltas/config/retoTargets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retoTargets })
  });
}

export async function saveHoursPerModule(hoursPerModule: Record<string, number>): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/faltas/config/hoursPerModule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hoursPerModule })
  });
}

// --- Snapshot/Auth/Sync ---
export async function getSnapshot(): Promise<any> {
  return request<any>("/api/faltas/snapshot", { cache: "no-store" as any });
}

export async function postSync(): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/faltas/sync", { method: "POST" });
}

export async function logout(): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/faltas/logout", { method: "POST" });
}

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
  return request<StatisticsResponse>(`/api/faltas/statistics?${params}`);
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
  return request<SelectedWeekResponse>(`/api/faltas/selectedWeek?${params}`);
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
  return request<CalculateResponse>(`/api/faltas/calculate?${params}`);
}

export async function postCalculationPlan(
  dni: string,
  entries: CalculationPlanEntry[]
): Promise<CalculatePlanResponse> {
  return request<CalculatePlanResponse>(`/api/faltas/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dni, entries })
  });
}

// --- Notices/Updates (por si se usan en UI) ---
export type Notice = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  action?: { label: string; href: string } | undefined;
};

export async function getNotices(): Promise<{ notices: Notice[] }> {
  return request<{ notices: Notice[] }>("/api/notices");
}

// --- Hooks helpers (no React deps) ---
export async function fetchStatistics(dni: string, moduleFilter: string = "all", absenceFilter: string = "all") {
  return getStatistics(dni, moduleFilter, absenceFilter);
}
