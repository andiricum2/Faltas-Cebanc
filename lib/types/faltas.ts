export type Role = "A" | "P" | "D" | "E";

export type LoginBody = {
  role: Role;
  username: string;
  password: string;
};

export function isLoginBody(value: unknown): value is LoginBody {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.role === "A" || v.role === "P" || v.role === "D" || v.role === "E") &&
    typeof v.username === "string" &&
    typeof v.password === "string"
  );
}

export type LoginResult = {
  ok: boolean;
  errorCode?: 1 | 2 | 3;
  errorMessage?: string;
  sessionId?: string;
};

// ---- Scraping domain types ----

export type UserIdentity = {
  fullName: string;
  dni: string;
  group?: string;
};

export type SessionCell = {
  hour: number; // 1..6
  weekday: 1 | 2 | 3 | 4 | 5; // Mon..Fri
  dateISO: string; // yyyy-mm-dd for that weekday in the chosen week
  title: string | null; // e.g., "2DM3 - R1"
  cssClass: string | null; // e.g., "colblanco nofalta" or "falta_J"
};

export type WeekSessions = {
  weekStartISO: string; // Monday ISO date yyyy-mm-dd
  weekEndISO: string; // Friday ISO date yyyy-mm-dd
  daysISO: string[]; // 5 length, Mon..Fri
  sessions: SessionCell[]; // up to 6*5 cells
};

export type LegendModules = Record<string, string>; // ModuleCode -> Description

export type LegendAbsenceTypes = Record<string, string>; // e.g., J -> "FALTA JUSTIFICADA"

export type GlobalPercentages = {
  name: string; // row name (student)
  totalPercent: number; // overall %
  byModule: Record<string, number>; // module -> percent number
};

export type AggregatedStats = {
  modules: Record<
    string,
    {
      classesGiven: number; // number of sessions of that module (any color)
      absenceCounts: Record<string, number>; // absence code -> count (e.g., J, F, R, ...)
    }
  >;
  absenceTotals: Record<string, number>; // absence code -> total count across modules
};

export type RetoInfo = {
  id: string;
  label: string;
  group: string | null;
};

export type StudentSnapshot = {
  identity: UserIdentity;
  legend: {
    modules: LegendModules;
    absenceTypes: LegendAbsenceTypes;
  };
  percentages: GlobalPercentages;
  weeks: WeekSessions[];
  aggregated: AggregatedStats;
  retos?: RetoInfo[];
  coeficientes?: Record<string, Record<string, number>>; // c[retoId][moduleId]
  moduleCalculations?: Record<string, {
    faltasDirectas: number;
    faltasDerivadas: number;
    sesionesDirectas: number;
    sesionesDerivadas: number;
    totalFaltas: number;
  }>; // Cálculos detallados por módulo (incluyendo distribución de retos)
};


