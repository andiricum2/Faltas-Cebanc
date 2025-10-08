// Tipos específicos para snapshot y datos relacionados
export interface SnapshotModule {
  faltasDirectas?: number;
  faltasDerivadas?: number;
  sesionesDirectas?: number;
  sesionesDerivadas?: number;
  totalFaltas?: number;
  totalSesiones?: number;
}

export interface SnapshotModuleCalculations {
  [moduleCode: string]: SnapshotModule;
}

export interface SnapshotAggregated {
  modules?: Record<string, any>;
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
    cssClass?: string;
    title?: string;
  }>;
}

export interface SnapshotReto {
  id: string;
  label: string;
  absenceCounts: Record<string, number>;
  classesGiven: number;
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
