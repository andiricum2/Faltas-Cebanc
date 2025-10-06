import type { StudentSnapshot } from "@/lib/types/faltas";
import { sumarFaltas, calcPercent } from "@/lib/utils/calculations";

export type ModuleBaseStats = { classes: number; absences: number };

export function getModuleBaseStats(snap: StudentSnapshot, code: string): ModuleBaseStats {
  const moduleCalcs = (snap as any).moduleCalculations?.[code];
  const classes = moduleCalcs
    ? ((moduleCalcs?.sesionesDirectas || 0) + (moduleCalcs?.sesionesDerivadas || 0))
    : (snap.aggregated?.modules?.[code]?.classesGiven || 0);
  const absences = moduleCalcs?.totalFaltas ??
    sumarFaltas(snap.aggregated?.modules?.[code]?.absenceCounts);
  return { classes, absences };
}

export function sumGeneral(snap: StudentSnapshot): { totalSessions: number; totalAbsences: number } {
  const hasModuleCalcs = !!(snap as any).moduleCalculations;
  const totalSessions = hasModuleCalcs
    ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + ((m?.sesionesDirectas || 0) + (m?.sesionesDerivadas || 0)), 0)
    : Object.values(snap.aggregated?.modules || {}).reduce((acc, m: any) => acc + (m?.classesGiven || 0), 0);
  const totalAbsences = hasModuleCalcs
    ? Object.values((snap as any).moduleCalculations || {}).reduce((acc: number, m: any) => acc + (m?.totalFaltas || 0), 0)
    : sumarFaltas(snap.aggregated?.absenceTotals);
  return { totalSessions, totalAbsences };
}

export function buildBaseByModule(snapshot: StudentSnapshot): Record<string, { sessions: number; absences: number; label: string }> {
  const out: Record<string, { sessions: number; absences: number; label: string }> = {};
  for (const code of Object.keys(snapshot.aggregated?.modules || {})) {
    const base = getModuleBaseStats(snapshot, code);
    out[code] = {
      sessions: Number(base.classes || 0),
      absences: Number(base.absences || 0),
      label: snapshot.legend?.modules?.[code] || code
    };
  }
  return out;
}

export function computeRetoProjection(moduleClasses: number, moduleAbsences: number, added: number, coef: number) {
  const retoFaltasDistribuidasProjected = added > 0 ? moduleAbsences + (added * coef) : moduleAbsences;
  const retoClasesImpartidasDistribuidasProjected = added > 0 ? moduleClasses + (added * coef) : moduleClasses;
  const totalFaltasProjected = moduleAbsences + retoFaltasDistribuidasProjected;
  const totalSessionsProjected = moduleClasses + retoClasesImpartidasDistribuidasProjected;
  const current = calcPercent(moduleAbsences, moduleClasses);
  const projected = calcPercent(totalFaltasProjected, totalSessionsProjected);
  return { current, projected };
}


