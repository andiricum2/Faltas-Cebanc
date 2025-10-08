import type { WeekSessions } from "@/lib/types/faltas";
import { AutoSyncMinutes } from "../types/snapshot";
import { request } from "@/lib/http/client";

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

// Note: GET calculations removed. Only POST plan remains.

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
    autoSyncMinutes: AutoSyncMinutes;
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

// Removed getCalculations (GET)

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


export async function postPlan(dni: string, entries: CalculationPlanEntry[]) {
  return postCalculationPlan(dni, entries);
}
