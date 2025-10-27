// Tipos específicos para snapshot y datos relacionados
export interface SnapshotModule {
  faltasDirectas?: number;
  faltasDerivadas?: number;
  faltasDerivadasPorTipo?: Record<string, number>; // Desglose por tipo de falta (F, J, R, etc.)
  sesionesDirectas?: number;
  sesionesDerivadas?: number;
  totalFaltas?: number;
  totalSesiones?: number;
}

export interface SnapshotModuleCalculations {
  [moduleCode: string]: SnapshotModule;
}

export interface SnapshotModuleAggregated {
  classesGiven: number;
  absenceCounts: Record<string, number>;
}

export interface SnapshotAggregated {
  modules?: Record<string, SnapshotModuleAggregated>;
  absenceTotals?: Record<string, number>;
}

export interface SnapshotLegend {
  modules?: Record<string, string>;
  absenceTypes?: Record<string, string>;
}

export interface SnapshotPercentages {
  totalPercent?: number;
  byModule?: Record<string, number>;
}

export interface SnapshotIdentity {
  dni?: string;
  fullName?: string;
  group?: string;
}

export interface SnapshotWeek {
  weekStartISO: string;
  weekEndISO: string;
  daysISO: string[];
  sessions: Array<{
    hour: number;
    weekday: number;
    cssClass?: string | null;
    title?: string | null;
  }>;
}

export interface SnapshotReto {
  id: string;
  label: string;
  absenceCounts?: Record<string, number>;
  classesGiven?: number;
}

export interface SnapshotData {
  identity?: SnapshotIdentity;
  legend?: SnapshotLegend;
  aggregated?: SnapshotAggregated;
  percentages?: SnapshotPercentages;
  weeks?: SnapshotWeek[];
  retos?: SnapshotReto[];
  moduleCalculations?: SnapshotModuleCalculations;
}

// Tipos para cálculos de módulos
export interface ModuleCalculation {
  code: string;
  name: string;
  faltasDirectas: number;
  faltasDerivadas: number;
  faltasDerivadasPorTipo: Record<string, number>; // Desglose por tipo de falta (F, J, R, etc.)
  sesionesDirectas: number;
  sesionesDerivadas: number;
  totalFaltas: number;
  totalSesiones: number;
  percent: number;
}

// Tipos para retos
export interface RetoCalculation {
  id: string;
  label: string;
  totalFaltas: number;
  totalSesiones: number;
  percent: number;
}

// Tipos para cálculos de página calcular
export interface ModuleMeta {
  code: string;
  label: string;
  isReto: boolean;
}

export interface CalculationsData {
  moduleMeta: ModuleMeta[];
}

// Tipos para planificación de cálculos
export interface PlannerEntry {
  id: string;
  kind: "abs" | "att"; // falta o asistencia
  code?: string; // código de módulo o reto
  amount: number;
}

// Tipos para configuración
export type HoursPerModule = Record<string, number>;
export type RetoTargets = Record<string, Record<string, boolean>>;
export type RetoModuleHours = Record<string, Record<string, number>>; // retoId -> moduleId -> hours
export type AutoSyncMinutes = number;

// Tipos para horario semanal (6 horas x 5 días)
// Structure: [hour][day] = moduleCode | null
// hour: 0-5 (representing hours 1-6)
// day: 0-4 (representing Monday-Friday)
export type WeekSchedule = (string | null)[][];

// Import theme types
import type { ThemeConfig } from "./theme";
